import { BI, HexString } from "@ckb-lumos/lumos";
import { molecule, number, blockchain, createObjectCodec, enhancePack } from "@ckb-lumos/codec/";
import { hashTypeCodec } from "./baseCodec";

const { table, struct } = molecule;
const { Bytes, Byte32 } = blockchain;
const { Uint32, Uint128, Uint64 } = number;

const RawWithdrawalLockArgsCodec = createObjectCodec({
  rollupHash: Byte32,
  withdrawalBlockhash: Byte32,
  withdrawalBlockNumber: Uint64,
  accountScriptHash: Byte32,
  ownerLockHash: Byte32,
});
export const WithdrawalLockArgsCodec = enhancePack(
  RawWithdrawalLockArgsCodec,
  () => new Uint8Array(0),
  (buf: Uint8Array) => ({
    rollupHash: buf.slice(0, 32),
    withdrawalBlockhash: buf.slice(32, 64),
    withdrawalBlockNumber: buf.slice(64, 72),
    accountScriptHash: buf.slice(72, 104),
    ownerLockHash: buf.slice(104, 136),
    script: buf.slice(136),
  }),
);

export type RawWithdrawalRequestV1 = {
  nonce: number;
  chain_id: BI;
  capacity: BI;
  amount: BI;
  sudt_script_hash: HexString;
  account_script_hash: HexString;
  registry_id: number;
  owner_lock_hash: HexString;
  fee: BI;
};

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
            registry_id: Uint32,
            owner_lock_hash: Byte32,
            fee: Uint128,
          },
          [
            "nonce",
            "chain_id",
            "capacity",
            "amount",
            "sudt_script_hash",
            "account_script_hash",
            "registry_id",
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

// table V1DepositLockArgs {
//   owner_lock_hash: Byte32,
//   layer2_lock: Script,
//   cancel_timeout: Uint64,
//   registry_id: Uint32,
// }

export const V1DepositLockArgs = table(
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
    registry_id: Uint32,
  },
  ["owner_lock_hash", "layer2_lock", "cancel_timeout", "registry_id"],
);
