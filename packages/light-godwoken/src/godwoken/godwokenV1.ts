/**
 * This file is copied from:
 * https://github.com/zeroqn/godwoken-examples/blob/develop/packages/godwoken/src/index.ts
 */
import { RPC } from "ckb-js-toolkit";
import { Hash, Hexadecimal, HexNumber, HexString, Script } from "@ckb-lumos/base";
import { debug } from "../debug";

interface LastL2BlockCommittedInfo {
  transaction_hash: Hash;
}

type PolyScript = {
  script: Script;
  typeHash: Hash;
};

export type PolyConfig = {
  nodeInfo: {
    rollupCell: {
      typeHash: Hash;
      typeScript: Script;
    };
    rollupConfig: {
      requiredStakingCapacity: Hexadecimal;
      challengeMaturityBlocks: Hexadecimal;
      finalityBlocks: Hexadecimal;
      rewardBurnRate: Hexadecimal;
      chainId: Hexadecimal;
    };
    gwScripts: {
      deposit: PolyScript;
      withdraw: PolyScript;
    };
    eoaScripts: {
      eth: PolyScript;
    };
  };
};

export class GodwokenV1 {
  private readonly rpc: RPC;

  constructor(url: string) {
    this.rpc = new RPC(url);
  }

  private async rpcCall(method_name: string, ...args: any[]): Promise<any> {
    const name = "gw_" + method_name;
    return this.rpc[name](...args);
  }

  /**
   * chain_id: u64 = (compatible_chain_id << 32) | creator_id
   *
   * e.g. 0x315DA00000005 = 868,450,977,185,797
   */
  async getChainId(): Promise<string> {
    const result = await this.rpc["eth_chainId"]();
    debug("chain_id:", result);
    return result;
  }

  async getBlockNumber(): Promise<HexNumber> {
    return this.rpc["eth_blockNumber"]();
  }

  async getConfig(): Promise<PolyConfig> {
    const result = await this.rpc["poly_version"]();
    debug("poly_version:", result);
    return result;
  }

  async getCkbBalance(address: HexString): Promise<string> {
    const result = await this.rpc["eth_getBalance"](address, "latest");
    debug("eth_getBalance:", result);
    return result;
  }

  async submitWithdrawalRequest(data: HexString): Promise<Hash> {
    return await this.rpcCall("submit_withdrawal_request", data);
  }

  async getLastSubmittedInfo(): Promise<LastL2BlockCommittedInfo> {
    return await this.rpcCall("get_last_submitted_info");
  }

  async getWithdrawal(txHash: Hash): Promise<Hash | undefined> {
    return await this.rpcCall("get_withdrawal", txHash);
  }
  async getScriptHashByShortAddress(address: HexString): Promise<Hash> {
    return await this.rpcCall("get_script_hash_by_short_address", address);
  }

  async getScript(script_hash: Hash): Promise<Script> {
    return await this.rpcCall("get_script", script_hash);
  }

  async getScriptHash(account_id: HexNumber): Promise<Hash> {
    return await this.rpcCall("get_script_hash", account_id);
  }

  async getData(data_hash: Hash): Promise<HexString> {
    return await this.rpcCall("get_data", data_hash);
  }

  async hasDataHash(data_hash: Hash): Promise<boolean> {
    return await this.rpcCall("get_data_hash", data_hash);
  }

  async getTransactionReceipt(l2_tx_hash: Hash) {
    return await this.rpcCall("get_transaction_receipt", l2_tx_hash);
  }

  async getAccountIdByScriptHash(scriptHash: Hash): Promise<HexNumber | undefined> {
    return await this.rpcCall("get_account_id_by_script_hash", scriptHash);
  }

  async getNonce(accountId: HexNumber): Promise<HexNumber> {
    return await this.rpcCall("get_nonce", accountId);
  }
}
