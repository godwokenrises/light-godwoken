import { Hash, HexString, HexNumber, Script } from "@ckb-lumos/base";

export type Uint32 = number;
export type Uint64 = bigint;
export type Uint128 = bigint;
export type Uint256 = bigint;

export interface RunResult {
  read_values: Map<Hash, Hash>;
  write_values: Map<Hash, Hash>;
  return_data: HexString;
  account_count?: HexNumber;
  new_scripts: Map<Hash, HexString>;
  write_data: Map<Hash, HexString>;
  read_data: Map<Hash, HexNumber>;
}
export interface RawL2Transaction {
  from_id: HexNumber;
  to_id: HexNumber;
  nonce: HexNumber;
  args: HexString;
}
export interface L2Transaction {
  raw: RawL2Transaction;
  signature: HexString;
}

export interface CreateAccount {
  script: Script;
}

export interface Fee {
  sudt_id: Uint32;
  amount: Uint128;
}

export interface RawWithdrawalRequest {
  nonce: HexNumber;
  // CKB amount
  capacity: HexNumber;
  // SUDT amount
  amount: HexNumber;
  sudt_script_hash: Hash;
  // layer2 account_script_hash
  account_script_hash: Hash;
  // buyer can pay sell_amount and sell_capacity to unlock
  sell_amount: HexNumber;
  sell_capacity: HexNumber;
  // layer1 lock to withdraw after challenge period
  owner_lock_hash: Hash;
  // layer1 lock to receive the payment, must exists on the chain
  payment_lock_hash: Hash;
  fee: Fee;
}
export interface WithdrawalRequest {
  raw: RawWithdrawalRequest;
  signature: HexString;
}

export interface RawWithdrawalRequestV1 {
  nonce: HexNumber;
  chain_id: HexNumber;
  // CKB amount
  capacity: HexNumber;
  // SUDT amount
  amount: HexNumber;
  sudt_script_hash: Hash;
  // layer2 account_script_hash
  account_script_hash: Hash;
  // layer1 lock to withdraw after challenge period
  owner_lock_hash: Hash;
  fee: HexNumber;
}

export interface WithdrawalRequestV1 {
  raw: RawWithdrawalRequestV1;
  signature: HexString;
}

export interface WithdrawalRequestExtra {
  request: WithdrawalRequestV1;
  owner_lock: Script;
}

export interface WithdrawalLockArgs {
  // layer2 account script hash
  account_script_hash: Hash;
  // the original custodian lock hash
  withdrawal_block_hash: Hash;
  withdrawal_block_number: HexNumber;
  // buyer can pay sell_amount token to unlock
  sudt_script_hash: Hash;
  sell_amount: HexNumber;
  sell_capacity: HexNumber;
  // layer1 lock to withdraw after challenge period
  owner_lock_hash: Hash;
  // layer1 lock to receive the payment, must exists on the chain
  payment_lock_hash: Hash;
}

export interface UnlockWithdrawalViaFinalize {
  block_proof: HexString;
}

// export interface HeaderInfo {
//     number: Uint64;
//     block_hash: Hash;
// }
// FIXME: todo
// export interface L2Block {}
export enum Status {
  Running = "running",
  Halting = "halting",
}

export interface LastL2BlockCommittedInfo {
  transaction_hash: Hash;
}
