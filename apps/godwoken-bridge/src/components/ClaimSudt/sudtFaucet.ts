import { ecdsaSign } from "secp256k1";
import { bytes } from "@ckb-lumos/codec";
import { blockchain } from "@ckb-lumos/base";
import { CkbIndexer } from "@ckb-lumos/ckb-indexer/lib/indexer";
import { number } from "@ckb-lumos/codec";
import { hd, helpers, utils } from "@ckb-lumos/lumos";
import { RPC, Script, HashType, BI, Cell, CellDep, HexString } from "@ckb-lumos/lumos";
import { LightGodwokenConfig, EthereumProvider, NotEnoughCapacityError, CodecLayer1 } from "light-godwoken";
import TransactionManager from "@ckb-lumos/transaction-manager";

// The private key for transferring SUDT
const DEFAULT_ISSUER_PRIVATE_KEY = process.env.REACT_APP_L1_TEST_TOKEN_ISSUER_PRIVATE_KEY!;

export async function claimUSDC(params: {
  ethereum: EthereumProvider;
  config: LightGodwokenConfig;
  ethAddress: HexString;
  rpc: RPC;
  indexer: CkbIndexer;
  transactionManager: TransactionManager;
  issuerPrivateKey?: HexString;
}): Promise<HexString> {
  let txSkeleton = await generateClaimUSDCTxSkeleton(
    params.config,
    params.ethAddress,
    params.indexer,
    params.transactionManager,
    params.issuerPrivateKey,
  );
  const userSignature = await userSignTransaction(txSkeleton, params.ethereum);
  const issuerSignature = await issuerSignTransaction(txSkeleton, params.issuerPrivateKey);
  txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.push(userSignature, issuerSignature));
  const signedTx = helpers.createTransactionFromSkeleton(txSkeleton);

  const txHash = await (params.transactionManager as any).sendTransaction(signedTx, "passthrough");
  console.debug("claim sudt txHash is:", txHash);
  return txHash;
}

export async function generateClaimUSDCTxSkeleton(
  config: LightGodwokenConfig,
  ethAddress: HexString,
  indexer: CkbIndexer,
  transactionManager: TransactionManager,
  issuerPrivateKey?: HexString,
): Promise<helpers.TransactionSkeletonType> {
  const { omniLock, sudt, secp256k1Blake160: secp256k1 } = config.layer1Config.SCRIPTS;

  const issuerPubKey = hd.key.privateToPublic(issuerPrivateKey || DEFAULT_ISSUER_PRIVATE_KEY);
  const issuerArgs = hd.key.publicKeyToBlake160(issuerPubKey);
  const issuerLock: Script = {
    codeHash: secp256k1.codeHash,
    hashType: secp256k1.hashType,
    args: issuerArgs,
  };
  const sudtType: Script = {
    codeHash: sudt.codeHash,
    hashType: sudt.hashType,
    args: utils.computeScriptHash(issuerLock),
  };

  const userOmniLock: Script = {
    codeHash: omniLock.codeHash,
    hashType: "type" as HashType,
    args: `0x01${ethAddress.substring(2)}00`,
  };

  const sudtCellCapacity = BI.from(144).mul(100000000);
  const txFee = BI.from(100000);
  const needCkb = sudtCellCapacity.add(txFee);

  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });

  const userCellCollector = transactionManager.collector({
    lock: userOmniLock,
    type: "empty",
    //outputDataLenRange: ["0x0", "0x1"],
  });
  let collectedSum = BI.from(0);
  const collectedCells: Cell[] = [];
  for await (const cell of userCellCollector.collect()) {
    collectedSum = collectedSum.add(cell.cellOutput.capacity);
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
  const issuerCellCollector = transactionManager.collector({
    lock: issuerLock,
    type: "empty",
    //outputDataLenRange: ["0x0", "0x1"],
  });
  let issuerCellCapacity = BI.from(0);
  for await (const cell of issuerCellCollector.collect()) {
    issuerCellCapacity = issuerCellCapacity.add(cell.cellOutput.capacity);
    collectedCells.push(cell);
    break;
  }

  txSkeleton = txSkeleton.update("inputs", (inputs) => {
    return inputs.push(...collectedCells);
  });
  const sudtCell: Cell = {
    cellOutput: {
      capacity: sudtCellCapacity.toHexString(),
      lock: userOmniLock,
      type: sudtType,
    },
    data: bytes.hexify(number.Uint128LE.pack(BI.from(1000).mul(BI.from(10).pow(18)))), // 1000 sudt in uint128
  };
  const exchangeCell: Cell = {
    cellOutput: {
      capacity: collectedSum.sub(sudtCellCapacity).sub(txFee).toHexString(),
      lock: userOmniLock,
    },
    data: "0x",
  };
  const issuerExchangeCell: Cell = {
    cellOutput: {
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
  const { omniLock, sudt, secp256k1Blake160: secp256k1 } = config.layer1Config.SCRIPTS;

  return [
    {
      outPoint: {
        txHash: omniLock.txHash,
        index: omniLock.index,
      },
      depType: "code",
    },
    {
      outPoint: {
        txHash: secp256k1.txHash,
        index: secp256k1.index,
      },
      depType: secp256k1.depType,
    },
    {
      outPoint: {
        txHash: sudt.txHash,
        index: sudt.index,
      },
      depType: sudt.depType,
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
  return bytes.hexify(
    blockchain.WitnessArgs.pack({
      lock: CodecLayer1.OmniLockWitnessLockCodec.pack({ signature: signedMessage }).buffer,
    }),
  );
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
  return bytes.hexify(
    blockchain.WitnessArgs.pack({
      lock: bytes.bytify(signedMessage).buffer,
    }),
  );
}

function generateUserMessage(tx: helpers.TransactionSkeletonType): HexString {
  const hasher = new utils.CKBHasher();
  const rawTxHash = utils.ckbHash(blockchain.RawTransaction.pack(helpers.createTransactionFromSkeleton(tx)).buffer);
  const serializedWitness = blockchain.WitnessArgs.pack({
    lock: bytes.bytify("0x" + "00".repeat(85)).buffer,
  });
  hasher.update(rawTxHash);
  hashWitness(hasher, serializedWitness.buffer);
  return hasher.digestHex();
}

function generateIssuerMessage(tx: helpers.TransactionSkeletonType): HexString {
  const hasher = new utils.CKBHasher();
  const rawTxHash = utils.ckbHash(blockchain.RawTransaction.pack(helpers.createTransactionFromSkeleton(tx)).buffer);
  hasher.update(rawTxHash);
  const serializedSudtWitness = blockchain.WitnessArgs.pack({
    lock: bytes.bytify(`0x${"00".repeat(65)}`).buffer,
  });
  hashWitness(hasher, serializedSudtWitness.buffer);
  return hasher.digestHex();
}

function hashWitness(hasher: utils.CKBHasher, witness: ArrayBuffer): void {
  const packedLength = number.Uint64LE.pack(witness.byteLength);
  hasher.update(packedLength.buffer);
  hasher.update(witness);
}

async function signMessageWithPrivateKey(message: string, privkey: string) {
  const signObject = ecdsaSign(bytes.bytify(message), bytes.bytify(privkey));
  const signatureBuffer = new ArrayBuffer(65);
  const signatureArray = new Uint8Array(signatureBuffer);
  signatureArray.set(signObject.signature, 0);
  signatureArray.set([signObject.recid], 64);
  return bytes.hexify(signatureBuffer);
}
