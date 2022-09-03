import axios from "axios";
import { Hash } from "@ckb-lumos/base";
import { HexString } from "@ckb-lumos/lumos";
import { DepositHistoryResponse } from "./requestTypes/depositHistories";
import { WithdrawalHistoryResponse, WithdrawalHistoryV0 } from "./requestTypes/withdrawalHistories";

export class GodwokenScanner {
  private readonly axios;

  constructor(url: string) {
    this.axios = axios.create({
      baseURL: url,
      timeout: 30000,
    });
  }

  async getDepositHistories(ethAddress: HexString, page: number = 1) {
    const { data } = await this.axios.request<DepositHistoryResponse>({
      url: "/deposit_histories",
      params: {
        eth_address: ethAddress,
        page,
      },
    });

    return data;
  }

  async getWithdrawalHistories(ownerLockHash: Hash) {
    const { data } = await this.axios.request<WithdrawalHistoryResponse>({
      url: "/withdrawal_histories",
      params: {
        owner_lock_hash: ownerLockHash,
      },
    });

    return data.data.map((item) => item.attributes);
  }

  async getWithdrawalHistoriesV0(ownerLockHash: Hash) {
    const result = await this.getWithdrawalHistories(ownerLockHash);
    console.debug("getWithdrawalHistories v0:", result);
    return result as WithdrawalHistoryV0[];
  }
}
