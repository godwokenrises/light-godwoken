import { Cell, HexString, Script, HashType, BI, helpers } from "@ckb-lumos/lumos";
import { number, bytes } from "@ckb-lumos/codec";
import { LightGodwokenConfig } from "../config";
import { RawWithdrawal } from "../schemas/codecV0";
import { RawWithdrawalRequestV1 } from "../schemas/codecV1";

export const randomHexString = (byteLength: number) => {
  let randomString = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16);
  if (randomString.length < byteLength * 2) {
    return `0x${randomString.padStart(byteLength * 2, "0")}`;
  } else {
    return `0x${randomString.slice(0, byteLength * 2)}`;
  }
};

export const dummyScriptHash: HexString = `0x${"0".repeat(64)}`;

export const randomScript = (byteLength: number): Script => {
  return {
    codeHash: randomHexString(32),
    hashType: "type" as HashType,
    args: randomHexString(byteLength),
  };
};

export const randomSudtTypeScriptWithoutArgs = (config: LightGodwokenConfig): Script => {
  return {
    codeHash: config.layer1Config.SCRIPTS.sudt.codeHash,
    hashType: config.layer1Config.SCRIPTS.sudt.hashType,
    args: "0x",
  };
};

export const randomSudtTypeScript = (config: LightGodwokenConfig): Script => {
  return {
    codeHash: config.layer1Config.SCRIPTS.sudt.codeHash,
    hashType: config.layer1Config.SCRIPTS.sudt.hashType,
    args: randomHexString(32),
  };
};

export const generateCellInput = (capacity: number, type?: Script, sudtData?: number) => {
  const txHash = randomHexString(32);
  const lock = {
    args: randomHexString(20),
    codeHash: randomHexString(32),
    hashType: "type" as HashType,
  };
  const cellInput: Cell = {
    blockNumber: "0x0",
    outPoint: {
      index: "0x0",
      txHash,
    },
    cellOutput: {
      capacity: BI.from(capacity).mul(100000000).toHexString(),
      lock,
      type,
    },
    data: sudtData ? bytes.hexify(number.Uint128LE.pack(BI.from(sudtData).mul(1000000000000000000))) : "0x",
  };
  return cellInput;
};

export const outputCapacityOf = (tx: helpers.TransactionSkeletonType): BI => {
  const outputs = tx.outputs.toArray();
  return outputs.reduce((sum, current) => sum.add(current.cellOutput.capacity), BI.from(0)).div(100000000);
};
export const inputCapacityOf = (tx: helpers.TransactionSkeletonType): BI => {
  const inputs = tx.inputs.toArray();
  return inputs.reduce((sum, current) => sum.add(current.cellOutput.capacity), BI.from(0)).div(100000000);
};
export const outputSudtAmountOf = (tx: helpers.TransactionSkeletonType): BI => {
  const outputs = tx.outputs.toArray();
  return outputs
    .reduce((sum, current) => {
      if (current.cellOutput.type) {
        return sum.add(number.Uint128LE.unpack(current.data));
      } else {
        return sum;
      }
    }, BI.from(0))
    .div(1000000000000000000);
};

export const deBifyRawWithdrawalRequestV0 = (rawWithdrawal: RawWithdrawal) => {
  return {
    ...rawWithdrawal,
    capacity: rawWithdrawal.capacity.toHexString(),
    amount: rawWithdrawal.amount.toHexString(),
    sell_amount: rawWithdrawal.sell_amount.toHexString(),
    sell_capacity: rawWithdrawal.sell_capacity.toHexString(),
    fee: {
      amount: rawWithdrawal.fee.amount.toHexString(),
      sudt_id: rawWithdrawal.fee.sudt_id,
    },
  };
};

export const deBifyRawWithdrawalRequestV1 = (rawWithdrwal: RawWithdrawalRequestV1) => {
  return {
    ...rawWithdrwal,
    chain_id: rawWithdrwal.chain_id.toHexString(),
    capacity: rawWithdrwal.capacity.toHexString(),
    amount: rawWithdrwal.amount.toHexString(),
    fee: rawWithdrwal.fee.toHexString(),
  };
};
