import { Hash } from "@ckb-lumos/base";
import { Udt } from "../baseTypes/godwokenScannerDataTypes";
import { PagedResponse, TypedData } from "../baseTypes/godwokenScannerTypes";

export interface WithdrawalHistory {
  amount: string;
  capacity: string;
  block_hash: Hash;
  block_number: number;
  l2_script_hash: Hash;
  layer1_block_number: number;
  layer1_output_index: number;
  layer1_tx_hash: Hash;
  owner_lock_hash: Hash;
  state: "pending" | "succeed" | "failed";
  timestamp: string;
  udt_id: number;
  udt_script_hash: Hash;
}

export interface WithdrawalHistoryV0 extends WithdrawalHistory {
  is_fast_withdrawal: boolean;
}

export type WithdrawalHistoryResponse = PagedResponse<
  TypedData<"withdrawal_history", WithdrawalHistory>,
  TypedData<"udt", Udt>
>;

export type WithdrawalHistoryV0Response = PagedResponse<
  TypedData<"withdrawal_history", WithdrawalHistoryV0>,
  TypedData<"udt", Udt>
>;
