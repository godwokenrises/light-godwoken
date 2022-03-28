import { Hash, HexString, Script } from "@ckb-lumos/base";
import { BI } from "@ckb-lumos/lumos";
import { RPC } from "ckb-js-toolkit";

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

  private async rpcCall(method_name: string, ...args: any[]): Promise<any> {
    const name = "gw_" + method_name;
    const result = await this.rpc[name](...args);
    return result;
  }

  async submitWithdrawalReqV1(data: Hash): Promise<Hash> {
    return await this.rpcCall("submit_withdrawal_request", data);
  }

  async getScriptHashByShortAddress(address: HexString): Promise<Hash> {
    return await this.rpcCall("get_script_hash_by_short_address", address);
  }

  async getAccountIdByScriptHash(script_hash: Hash): Promise<number | undefined> {
    const id = await this.rpcCall("get_account_id_by_script_hash", script_hash);
    return id ? +id : undefined;
  }

  async getBalance(sudt_id: number, address: HexString): Promise<BI> {
    const sudt_id_hex = `0x${(+sudt_id).toString(16)}`;
    const balance = await this.rpcCall("get_balance", address, sudt_id_hex);
    return BI.from(balance);
  }

  async getNonce(account_id: number): Promise<number> {
    const account_id_hex = `0x${account_id.toString(16)}`;
    const nonce = await this.rpcCall("get_nonce", account_id_hex);
    return parseInt(nonce);
  }

  async getScript(script_hash: Hash): Promise<Script> {
    return await this.rpcCall("get_script", script_hash);
  }

  async getScriptHash(account_id: number): Promise<Hash> {
    const account_id_hex = `0x${account_id.toString(16)}`;
    return await this.rpcCall("get_script_hash", account_id_hex);
  }
}

export * from "./codec";
