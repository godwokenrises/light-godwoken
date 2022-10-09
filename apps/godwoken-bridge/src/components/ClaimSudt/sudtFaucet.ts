import { ecdsaSign } from "secp256k1";
import { CkbIndexer } from "@ckb-lumos/ckb-indexer/lib/indexer";
import { number } from "@ckb-lumos/codec";
import { hd, helpers, utils, core, toolkit } from "@ckb-lumos/lumos";
import { RPC, Script, HashType, BI, Cell, CellDep, HexString } from "@ckb-lumos/lumos";
import { LightGodwokenConfig, EthereumProvider, NotEnoughCapacityError, CodecLayer1 } from "light-godwoken";

// The private key for transferring SUDT
const DEFAULT_ISSUER_PRIVATE_KEY = process.env.REACT_APP_L1_TEST_TOKEN_ISSUER_PRIVATE_KEY!;

export async function claimUSDC(params: {
  ethereum: EthereumProvider;
  config: LightGodwokenConfig;
  ethAddress: HexString;
  rpc: RPC;
  indexer: CkbIndexer;
  issuerPrivateKey?: HexString;
}): Promise<HexString> {
  let txSkeleton = await generateClaimUSDCTxSkeleton(
    params.config,
    params.ethAddress,
    params.indexer,
    params.issuerPrivateKey,
  );
  const userSignature = await userSignTransaction(txSkeleton, params.ethereum);
  const issuerSignature = await issuerSignTransaction(txSkeleton, params.issuerPrivateKey);
  txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.push(userSignature, issuerSignature));
  const signedTx = helpers.createTransactionFromSkeleton(txSkeleton);

  const txHash = await params.rpc.send_transaction(signedTx, "passthrough");
  console.debug("claim sudt txHash is:", txHash);
  return txHash;
}

export async function generateClaimUSDCTxSkeleton(
  config: LightGodwokenConfig,
  ethAddress: HexString,
  indexer: CkbIndexer,
  issuerPrivateKey?: HexString,
): Promise<helpers.TransactionSkeletonType> {
  const { omni_lock: omniLock, sudt, secp256k1_blake160: secp256k1 } = config.layer1Config.SCRIPTS;

  const issuerPubKey = hd.key.privateToPublic(issuerPrivateKey || DEFAULT_ISSUER_PRIVATE_KEY);
  const issuerArgs = hd.key.publicKeyToBlake160(issuerPubKey);
  const issuerLock: Script = {
    code_hash: secp256k1.code_hash,
    hash_type: secp256k1.hash_type,
    args: issuerArgs,
  };
  const sudtType: Script = {
    code_hash: sudt.code_hash,
    hash_type: sudt.hash_type,
    args: utils.computeScriptHash(issuerLock),
  };

  const userOmniLock: Script = {
    code_hash: omniLock.code_hash,
    hash_type: "type" as HashType,
    args: `0x01${ethAddress.substring(2)}00`,
  };

  const sudtCellCapacity = BI.from(144).mul(100000000);
  const txFee = BI.from(100000);
  const needCkb = sudtCellCapacity.add(txFee);

  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });

  const userCellCollector = indexer.collector({
    lock: userOmniLock,
    type: "empty",
    outputDataLenRange: ["0x0", "0x1"],
  });
  let collectedSum = BI.from(0);
  const collectedCells: Cell[] = [];
  for await (const cell of userCellCollector.collect()) {
    collectedSum = collectedSum.add(cell.cell_output.capacity);
    collectedCells.push(cell);
    if (collectedSum.gte(needCkb)) {
      break;
    }
  }
  if (collectedSum.lt(needCkb)) {
    throw new NotEnoughCapacityError(
      { expected: needCkb, actual: collectedSum },
      "Not enough CKB, go get some CKB from faucet.",
    );
    // throw new Error("Not enough CKB, go get some CKB from faucet.");
  }

  // collect one isuer cell, so that the issuer will need to sign the transaction, which is essential in sudt mint
  const issuerCellCollector = indexer.collector({
    lock: issuerLock,
    type: "empty",
    outputDataLenRange: ["0x0", "0x1"],
  });
  let issuerCellCapacity = BI.from(0);
  for await (const cell of issuerCellCollector.collect()) {
    issuerCellCapacity = issuerCellCapacity.add(cell.cell_output.capacity);
    collectedCells.push(cell);
    break;
  }

  txSkeleton = txSkeleton.update("inputs", (inputs) => {
    return inputs.push(...collectedCells);
  });
  const sudtCell: Cell = {
    cell_output: {
      capacity: sudtCellCapacity.toHexString(),
      lock: userOmniLock,
      type: sudtType,
    },
    data: utils.toBigUInt128LE(BI.from(1000).mul(BI.from(10).pow(18))), // 1000 sudt in uint128
  };
  const exchangeCell: Cell = {
    cell_output: {
      capacity: collectedSum.sub(sudtCellCapacity).sub(txFee).toHexString(),
      lock: userOmniLock,
    },
    data: "0x",
  };
  const issuerExchangeCell: Cell = {
    cell_output: {
      capacity: issuerCellCapacity.toHexString(),
      lock: issuerLock,
    },
    data: "0x",
  };
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push(exchangeCell, sudtCell, issuerExchangeCell);
  });

  txSkeleton = txSkeleton.update("cellDeps", (cellDeps) => {
    return cellDeps.push(...getClaimSUDTCellDeps(config));
  });

  return txSkeleton;
}

function getClaimSUDTCellDeps(config: LightGodwokenConfig): CellDep[] {
  const { omni_lock: omniLock, sudt, secp256k1_blake160: secp256k1 } = config.layer1Config.SCRIPTS;

  return [
    {
      out_point: {
        tx_hash: omniLock.tx_hash,
        index: omniLock.index,
      },
      dep_type: "code",
    },
    {
      out_point: {
        tx_hash: secp256k1.tx_hash,
        index: secp256k1.index,
      },
      dep_type: secp256k1.dep_type,
    },
    {
      out_point: {
        tx_hash: sudt.tx_hash,
        index: sudt.index,
      },
      dep_type: sudt.dep_type,
    },
  ];
}

export async function userSignTransaction(
  txSkeleton: helpers.TransactionSkeletonType,
  ethereum: EthereumProvider,
): Promise<HexString> {
  const message = generateUserMessage(txSkeleton);
  let signedMessage = await ethereum.signMessage(message);
  let v = Number.parseInt(signedMessage.slice(-2), 16);
  if (v >= 27) v -= 27;
  signedMessage = "0x" + signedMessage.slice(2, -2) + v.toString(16).padStart(2, "0");
  const signedWitness = new toolkit.Reader(
    core.SerializeWitnessArgs({
      lock: CodecLayer1.OmniLockWitnessLockCodec.pack({ signature: signedMessage }).buffer,
    }),
  ).serializeJson();
  return signedWitness;
}

async function issuerSignTransaction(
  txSkeleton: helpers.TransactionSkeletonType,
  issuerPrivateKey?: HexString,
): Promise<HexString> {
  const message = generateIssuerMessage(txSkeleton);
  let signedMessage = await signMessageWithPrivateKey(message, issuerPrivateKey ?? DEFAULT_ISSUER_PRIVATE_KEY);
  let v = Number.parseInt(signedMessage.slice(-2), 16);
  if (v >= 27) v -= 27;
  signedMessage = "0x" + signedMessage.slice(2, -2) + v.toString(16).padStart(2, "0");
  const signedWitness = new toolkit.Reader(
    core.SerializeWitnessArgs({
      lock: new toolkit.Reader(signedMessage),
    }),
  ).serializeJson();
  return signedWitness;
}

function generateUserMessage(tx: helpers.TransactionSkeletonType): HexString {
  const hasher = new utils.CKBHasher();
  const rawTxHash = utils.ckbHash(
    core.SerializeRawTransaction(
      toolkit.normalizers.NormalizeRawTransaction(helpers.createTransactionFromSkeleton(tx)),
    ),
  );
  const serializedWitness = core.SerializeWitnessArgs({
    lock: new toolkit.Reader("0x" + "00".repeat(85)),
  });
  hasher.update(rawTxHash);
  hashWitness(hasher, serializedWitness);
  return hasher.digestHex();
}

function generateIssuerMessage(tx: helpers.TransactionSkeletonType): HexString {
  const hasher = new utils.CKBHasher();
  const rawTxHash = utils.ckbHash(
    core.SerializeRawTransaction(
      toolkit.normalizers.NormalizeRawTransaction(helpers.createTransactionFromSkeleton(tx)),
    ),
  );
  hasher.update(rawTxHash);
  const serializedSudtWitness = core.SerializeWitnessArgs({
    lock: new toolkit.Reader(`0x${"00".repeat(65)}`),
  });
  hashWitness(hasher, serializedSudtWitness);
  return hasher.digestHex();
}

function hashWitness(hasher: utils.CKBHasher, witness: ArrayBuffer): void {
  const packedLength = number.Uint64LE.pack(witness.byteLength);
  hasher.update(packedLength.buffer);
  hasher.update(witness);
}

async function signMessageWithPrivateKey(message: string, privkey: string) {
  const signObject = ecdsaSign(
    new Uint8Array(new toolkit.Reader(message).toArrayBuffer()),
    new Uint8Array(new toolkit.Reader(privkey).toArrayBuffer()),
  );
  const signatureBuffer = new ArrayBuffer(65);
  const signatureArray = new Uint8Array(signatureBuffer);
  signatureArray.set(signObject.signature, 0);
  signatureArray.set([signObject.recid], 64);
  return new toolkit.Reader(signatureBuffer).serializeJson();
}
