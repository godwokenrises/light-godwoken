import { RPC } from "ckb-js-toolkit";
import { Hash, Hexadecimal, HexNumber, HexString, Script } from "@ckb-lumos/base";
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
export class Godwoken {
  private rpc: RPC;

  constructor(url: string) {
    this.rpc = new RPC(url);
  }

  /**
   * chain_id: u64 = (compatible_chain_id << 32) | creator_id
   *
   * e.g. 0x315DA00000005 = 868,450,977,185,797
   */
  async getChainId(): Promise<string> {
    const result = await this.rpc["eth_chainId"]();
    console.debug("chain_id:", result);
    return result;
  }

  async getConfig(): Promise<PolyConfig> {
    const result = await this.rpc["poly_version"]();
    console.debug("poly_version:", result);
    return result;
  }

  async getCkbBalance(address: HexString): Promise<string> {
    const result = await this.rpc["eth_getBalance"](address, "latest");
    console.debug("eth_getBalance:", result);
    return result;
  }

  private async rpcCall(method_name: string, ...args: any[]): Promise<any> {
    const name = "gw_" + method_name;
    const result = await this.rpc[name](...args);
    return result;
  }

  async submitWithdrawalRequest(data: HexString): Promise<Hash> {
    return await this.rpcCall("submit_withdrawal_request", data);
  }

  async getLastSubmittedInfo(): Promise<LastL2BlockCommittedInfo> {
    return await this.rpcCall("get_last_submitted_info");
  }
  // TODO
  // async function getWithdrawal(withdrawalHash: Hash) {
  //   withdrawal_hash
  // }
  /**
   *
   * @param txHash Hash
   * @returns uint32
   */
  async getWithdrawal(txHash: Hash): Promise<Hash | undefined> {
    const withdrawal = await this.rpcCall("get_withdrawal", txHash);
    return withdrawal;
  }
  async getScriptHashByShortAddress(address: HexString): Promise<Hash> {
    return await this.rpcCall("get_script_hash_by_short_address", address);
  }

  async getScript(script_hash: Hash): Promise<Script> {
    return await this.rpcCall("get_script", script_hash);
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
    const id = await this.rpcCall("get_account_id_by_script_hash", scriptHash);
    return id;
  }

  async getNonce(accountId: HexNumber): Promise<HexNumber> {
    const nonce = await this.rpcCall("get_nonce", accountId);
    return nonce;
  }
}
