import { Hash } from "@ckb-lumos/base";
import { Udt } from "../baseTypes/godwokenScannerDataTypes";
import { PagedResponse, TypedData } from "../baseTypes/godwokenScannerTypes";

export interface DepositHistory {
  capacity: string;
  ckb_lock_hash: Hash;
  layer1_block_number: number;
  layer1_output_index: number;
  layer1_tx_hash: Hash;
  timestamp: string;
  udt_id: number;
  value: string;
}

export type DepositHistoryResponse = PagedResponse<TypedData<"deposit_history", DepositHistory>, TypedData<"udt", Udt>>;
