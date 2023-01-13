import { molecule, number } from "@ckb-lumos/codec";
import { BI, HexString } from "@ckb-lumos/lumos";
import { blockchain } from "@ckb-lumos/base";
import { hashTypeCodec } from "./baseCodec";

const { table, option, struct } = molecule;
const { Uint32, Uint128, Uint8, Uint64 } = number;
const { Bytes, Byte32 } = blockchain;

export type RawWithdrawal = {
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
export const RawWithdrawalCodec = struct(
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
        raw: RawWithdrawalCodec,
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

export const V0DepositLockArgs = table(
  {
    owner_lock_hash: Byte32,
    layer2_lock: table(
      {
        code_hash: Byte32,
        hash_type: hashTypeCodec,
        args: Bytes,
      },
      ["code_hash", "hash_type", "args"],
    ),
    cancel_timeout: Uint64,
  },
  ["owner_lock_hash", "layer2_lock", "cancel_timeout"],
);
