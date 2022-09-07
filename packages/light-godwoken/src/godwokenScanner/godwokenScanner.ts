import axios, { AxiosError, AxiosInstance } from "axios";
import { Hash } from "@ckb-lumos/base";
import { HexString } from "@ckb-lumos/lumos";
import { DepositHistoryResponse } from "./requestTypes/depositHistories";
import { WithdrawalHistoryResponse, WithdrawalHistoryV0 } from "./requestTypes/withdrawalHistories";

export class GodwokenScanner {
  private readonly axios: AxiosInstance;

  constructor(url: string) {
    this.axios = axios.create({
      baseURL: url,
      timeout: 30000,
    });

    this.axios.interceptors.response.use((res) => {
      if (res.status === 200 && res.data?.error_code) {
        const message = res.data?.message || `GodwokenScanner responds with a status code ${res.data?.error_code}`;
        throw new AxiosError(message, res.data.error_code, res.config, res.request, res);
      }

      return res;
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
