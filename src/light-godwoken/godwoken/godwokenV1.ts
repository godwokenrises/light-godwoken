import { RPC } from "ckb-js-toolkit";
import { Hash, HexNumber, HexString, Script } from "@ckb-lumos/base";

export function numberToUInt32LE(value: number): HexString {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(value);
  return `0x${buf.toString("hex")}`;
}

export function UInt32LEToNumber(hex: HexString): number {
  const buf = Buffer.from(hex.slice(2, 10), "hex");
  return buf.readUInt32LE(0);
}

export function u32ToHex(value: number): HexString {
  return `0x${value.toString(16)}`;
}

export function hexToU32(hex: HexString): number {
  // return parseInt(hex.slice(2), "hex");
  return +hex;
}

export function toBuffer(ab: ArrayBuffer): Buffer {
  const buf = Buffer.alloc(ab.byteLength);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    buf[i] = view[i];
  }
  return buf;
}

export function toArrayBuffer(buf: Buffer) {
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
}

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
