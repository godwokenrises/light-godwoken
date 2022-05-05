import { RPC } from "ckb-js-toolkit";
import { Hash, HexNumber, HexString } from "@ckb-lumos/lumos";

interface LastL2BlockCommittedInfo {
  transaction_hash: Hash;
}
/**
 * Godwoken RPC client
 */
export class GodwokenClient {
  private rpc: RPC;

  constructor(url: string) {
    this.rpc = new RPC(url);
  }

  private async rpcCall(method_name: string, ...args: any[]): Promise<any> {
    const name = "gw_" + method_name;
    const result = await this.rpc[name](...args);
    return result;
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

  /**
   * Serialize withdrawal request and submit to godwoken
   *
   * @param request
   * @returns
   */
  async submitWithdrawalRequest(data: HexString): Promise<void> {
    return await this.rpcCall("submit_withdrawal_request", data);
  }

  /**
   *
   * @param scriptHash layer2 lock script hash
   * @returns uint32
   */
  async getAccountIdByScriptHash(scriptHash: Hash): Promise<HexNumber | undefined> {
    const id = await this.rpcCall("get_account_id_by_script_hash", scriptHash);
    return id;
  }

  /**
   *
   * @param shortAddress scriptHash160 (scriptHash first 20 bytes)
   * @returns uint32
   */
  async getScriptHashByShortAddress(shortAddress: HexString): Promise<Hash | undefined> {
    const scriptHash = await this.rpcCall("get_script_hash_by_short_address", shortAddress);
    return scriptHash;
  }
  /**
   *
   * @param txHash Hash
   * @returns uint32
   */
  async getWithdrawal(txHash: Hash): Promise<Hash | undefined> {
    const withdrawal = await this.rpcCall("get_withdrawal", txHash);
    return withdrawal;
  }
  /**
   *
   * @param accountId uint32 in hex number
   * @returns uint32 in hex number
   */
  async getNonce(accountId: HexNumber): Promise<HexNumber> {
    const nonce = await this.rpcCall("get_nonce", accountId);
    return nonce;
  }

  async getLastSubmittedInfo(): Promise<LastL2BlockCommittedInfo> {
    return await this.rpcCall("get_last_submitted_info");
  }
  /**
   *
   * @param accountId uint32 in hex number
   * @returns
   */
  async getScriptHash(accountId: HexNumber): Promise<Hash> {
    return await this.rpcCall("get_script_hash", accountId);
  }
}
