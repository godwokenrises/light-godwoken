import {
  createObjectCodec,
  Byte32,
  Uint64,
  enhancePack,
  table,
  Bytes,
  struct,
  Uint32,
  Uint128,
} from "@ckb-lumos/experiment-codec/";
import { createFixedBytesCodec } from "@ckb-lumos/experiment-codec/lib/base";

const hashTypeCodec = createFixedBytesCodec<string>({
  byteLength: 1,
  pack: (type) => {
    const data = new DataView(new ArrayBuffer(1));
    if (type === "data") {
      data.setUint8(0, 0);
    } else if (type === "type") {
      data.setUint8(0, 1);
    } else if (type === "data1") {
      data.setUint8(0, 2);
    } else {
      throw new Error(`invalid hash type: ${type}`);
    }
    return data.buffer;
  },
  unpack: (buf) => {
    const data = new DataView(buf).getUint8(0);
    if (data === 0) {
      return "data";
    } else if (data === 1) {
      return "type";
    } else if (data === 2) {
      return "data1";
    } else {
      throw new Error("invalid data");
    }
  },
});
const RawWithdrawalLockArgsCodec = createObjectCodec({
  rollupHash: Byte32,
  withdrawalBlockhash: Byte32,
  withdrawalBlockNumber: Uint64,
  accountScriptHash: Byte32,
  ownerLockHash: Byte32,
  // script: table({
  //   code_hash: Byte32,
  //   hash_type: Byte32,
  //   args: Bytes,
  // },["code_hash", "hash_type", "args"]),
});
export const WithdrawalLockArgsCodec = enhancePack(
  RawWithdrawalLockArgsCodec,
  () => new ArrayBuffer(0),
  (buf: ArrayBuffer) => ({
    rollupHash: buf.slice(0, 32),
    withdrawalBlockhash: buf.slice(32, 64),
    withdrawalBlockNumber: buf.slice(64, 72),
    accountScriptHash: buf.slice(72, 104),
    ownerLockHash: buf.slice(104, 136),
    script: buf.slice(136),
  }),
);
export const WithdrawalRequestExtraCodec = table(
  {
    request: table(
      {
        raw: struct(
          {
            nonce: Uint32,
            chain_id: Uint64,
            capacity: Uint64,
            amount: Uint128,
            sudt_script_hash: Byte32,
            account_script_hash: Byte32,
            owner_lock_hash: Byte32,
            fee: Uint64,
          },
          [
            "nonce",
            "chain_id",
            "capacity",
            "amount",
            "sudt_script_hash",
            "account_script_hash",
            "owner_lock_hash",
            "fee",
          ],
        ),
        signature: Bytes,
      },
      ["raw", "signature"],
    ),
    owner_lock: table(
      {
        code_hash: Byte32,
        hash_type: hashTypeCodec,
        args: Bytes,
      },
      ["code_hash", "hash_type", "args"],
    ),
  },
  ["request", "owner_lock"],
);
