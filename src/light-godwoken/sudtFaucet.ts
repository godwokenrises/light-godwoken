import { ecdsaSign } from "secp256k1";
import { Cell, CellDep, core, hd, HexString, toolkit } from "@ckb-lumos/lumos";
import { helpers, RPC, utils, Script, HashType, BI } from "@ckb-lumos/lumos";
import { SerializeRcLockWitnessLock } from "./omni-lock";
import { debug } from "./debug";
import { LightGodwokenConfig } from "./constants/configTypes";

const issuerPrivateKey = process.env.REACT_APP_CKB_USDC_ISSUER_PRIVATE_KEY!;

export async function claimUSDC(
  ethereum: any,
  config: LightGodwokenConfig,
  ethAddress: HexString,
  rpc: RPC,
  indexer: any,
): Promise<HexString> {
  let txSkeleton = await generateClaimUSDCTxSkeleton(config, ethAddress, indexer);
  const userSignature = await userSignTransaction(txSkeleton, ethereum);
  const issuerSignature = await issuerSignTransaction(txSkeleton);
  txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.push(userSignature, issuerSignature));
  const signedTx = helpers.createTransactionFromSkeleton(txSkeleton);

  const txHash = await rpc.send_transaction(signedTx, "passthrough");
  debug("claim sudt txHash is:", txHash);
  return txHash;
}

export async function generateClaimUSDCTxSkeleton(
  config: LightGodwokenConfig,
  ethAddress: HexString,
  indexer: any,
): Promise<helpers.TransactionSkeletonType> {
  const { omni_lock: omniLock, sudt, secp256k1_blake160: secp256k1 } = config.layer1Config.SCRIPTS;

  const issuerPubKey = hd.key.privateToPublic(issuerPrivateKey);
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
    throw new Error("Not enough CKB, go get some CKB from faucet.");
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
    data: "0x0000a0dec5adc9353600000000000000", // 1000 sudt in uint128
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

async function userSignTransaction(txSkeleton: helpers.TransactionSkeletonType, ethereum: any): Promise<HexString> {
  const message = generateUserMessage(txSkeleton);
  let signedMessage = await ethereum.request({
    method: "personal_sign",
    params: [ethereum.selectedAddress, message],
  });
  let v = Number.parseInt(signedMessage.slice(-2), 16);
  if (v >= 27) v -= 27;
  signedMessage = "0x" + signedMessage.slice(2, -2) + v.toString(16).padStart(2, "0");
  const signedWitness = new toolkit.Reader(
    core.SerializeWitnessArgs({
      lock: SerializeRcLockWitnessLock({
        signature: new toolkit.Reader(signedMessage),
      }),
    }),
  ).serializeJson();
  return signedWitness;
}

async function issuerSignTransaction(txSkeleton: helpers.TransactionSkeletonType): Promise<HexString> {
  const message = generateIssuerMessage(txSkeleton);
  let signedMessage = await signMessageWithPrivateKey(message, issuerPrivateKey);
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
  const rcLockBytelength = SerializeRcLockWitnessLock({
    signature: new toolkit.Reader("0x" + "00".repeat(65)),
  }).byteLength;
  const serializedWitness = core.SerializeWitnessArgs({
    lock: new toolkit.Reader("0x" + "00".repeat(rcLockBytelength)),
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
  const lengthBuffer = new ArrayBuffer(8);
  const view = new DataView(lengthBuffer);
  view.setBigUint64(0, BigInt(new toolkit.Reader(witness).length()), true);
  hasher.update(lengthBuffer);
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
