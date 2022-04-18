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
  Uint8,
  option,
} from "@ckb-lumos/experiment-codec/";
import { createFixedBytesCodec } from "@ckb-lumos/experiment-codec/lib/base";
import { BI } from "@ckb-lumos/lumos";

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

// struct RawWithdrawalRequest {
//   nonce: Uint32,
//   // CKB amount
//   capacity: Uint64,
//   // SUDT amount
//   amount: Uint128,
//   sudt_script_hash: Byte32,
//   // layer2 account_script_hash
//   account_script_hash: Byte32,
//   // buyer can pay sell_amount and sell_capacity to unlock
//   sell_amount: Uint128,
//   sell_capacity: Uint64,
//   // layer1 lock to withdraw after challenge period
//   owner_lock_hash: Byte32,
//   // layer1 lock to receive the payment, must exists on the chain
//   payment_lock_hash: Byte32,
//   // withdrawal fee, paid to block producer
//   fee: Fee,
// }

// struct Fee {
//   sudt_id: Uint32,
//   amount: Uint128,
// }

// vector WithdrawalRequestVec <WithdrawalRequest>;

// table WithdrawalRequest {
//   raw: RawWithdrawalRequest,
//   signature: Bytes,
// }
export const RawWithdrwalCodec = struct(
  {
    nonce: Uint32,
    capacity: Uint64,
    amount: Uint128,
    sudt_script_hash: Byte32,
    account_script_hash: Byte32,
    sell_amount: Uint128,
    sell_capacity: Uint64,
    owner_lock_hash: Byte32,
    payment_lock_hash: Byte32,
    fee: struct(
      {
        sudt_id: Uint32,
        amount: Uint128,
      },
      ["sudt_id", "amount"],
    ),
  },
  [
    "nonce",
    "capacity",
    "amount",
    "sudt_script_hash",
    "account_script_hash",
    "sell_amount",
    "sell_capacity",
    "owner_lock_hash",
    "payment_lock_hash",
    "fee",
  ],
);
export const WithdrawalRequestExtraCodec = table(
  {
    request: table(
      {
        raw: RawWithdrwalCodec,
        signature: Bytes,
      },
      ["raw", "signature"],
    ),
    owner_lock: option(
      table(
        {
          code_hash: Byte32,
          hash_type: hashTypeCodec,
          args: Bytes,
        },
        ["code_hash", "hash_type", "args"],
      ),
    ),
    withdraw_to_v1: Uint8,
  },
  ["request", "owner_lock", "withdraw_to_v1"],
);
