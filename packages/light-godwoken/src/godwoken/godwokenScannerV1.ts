import { Hash } from "@ckb-lumos/base";
import axios from "axios";

type WithdrawalHistory = {
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
};

interface WithdrawalHistoryV0 extends WithdrawalHistory {
  is_fast_withdrawal: boolean;
}

export class GodwokenScanner {
  private axios;

  constructor(url: string) {
    this.axios = axios.create({
      baseURL: url,
    });
  }
  async getWithdrawalHistories(ownerLockHash: Hash): Promise<WithdrawalHistory[]> {
    const result = await this.axios.get("/withdrawal_histories", {
      params: {
        owner_lock_hash: ownerLockHash,
      },
      timeout: 5000,
    });
    console.debug("getWithdrawalHistories v1:", result.data);
    const withdrawalHistories: WithdrawalHistory[] = result.data.data.map((item: any) => item.attributes);
    return withdrawalHistories;
  }

  async getWithdrawalHistoriesV0(ownerLockHash: Hash): Promise<WithdrawalHistoryV0[]> {
    const result = await this.axios.get("/withdrawal_histories", {
      params: {
        owner_lock_hash: ownerLockHash,
      },
      timeout: 5000,
    });
    console.debug("getWithdrawalHistories v0:", result.data);
    const withdrawalHistories: WithdrawalHistoryV0[] = result.data.data.map((item: any) => item.attributes);
    return withdrawalHistories;
  }
}
