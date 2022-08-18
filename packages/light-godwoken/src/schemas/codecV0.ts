import { molecule, number } from "@ckb-lumos/codec/";
import { blockchain } from "@ckb-lumos/base";
import { BI, HexString } from "@ckb-lumos/lumos";
import { hashTypeCodec } from "./baseCodec";

const { table, option, struct } = molecule;
const { Bytes, Byte32 } = blockchain;
const { Uint32, Uint128, Uint8, Uint64 } = number;

export type RawWithdrwal = {
  nonce: number;
  capacity: BI;
  amount: BI;
  sudt_script_hash: HexString;
  account_script_hash: HexString;
  sell_amount: BI;
  sell_capacity: BI;
  owner_lock_hash: HexString;
  payment_lock_hash: HexString;
  fee: {
    sudt_id: number;
    amount: BI;
  };
};
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
          codeHash: Byte32,
          hashType: hashTypeCodec,
          args: Bytes,
        },
        ["codeHash", "hashType", "args"],
      ),
    ),
    withdraw_to_v1: Uint8,
  },
  ["request", "owner_lock", "withdraw_to_v1"],
);

export const V0DepositLockArgs = table(
  {
    owner_lock_hash: Byte32,
    layer2_lock: table(
      {
        codeHash: Byte32,
        hashType: hashTypeCodec,
        args: Bytes,
      },
      ["codeHash", "hashType", "args"],
    ),
    cancel_timeout: Uint64,
  },
  ["owner_lock_hash", "layer2_lock", "cancel_timeout"],
);
