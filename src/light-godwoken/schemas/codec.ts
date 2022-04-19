import { molecule, number, blockchain, createFixedBytesCodec } from "@ckb-lumos/codec/";
const { table, option, struct } = molecule;
const { Bytes, Byte32 } = blockchain;
const { Uint32, Uint128, Uint8, Uint64 } = number;

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
    return new Uint8Array(data.buffer);
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
