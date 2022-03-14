import { helpers, Script, utils, BI } from "@ckb-lumos/lumos";
import {
  Godwoken as GodwokenV1,
  RawWithdrawalRequestV1,
  WithdrawalRequestExtra,
  WithdrawalRequestV1,
} from "./godwoken-v1/src/index";
import EventEmitter from "events";
import { ROLLUP_CONFIG, SCRIPTS } from "./constants";
import {
  WithdrawalEventEmitter,
  WithdrawalEventEmitterPayload,
  CKB_SUDT_ID,
  GodwokenVersion,
} from "./lightGodwokenType";
import DefaultLightGodwoken from "./lightGodwoken";

export default class LightGodwokenV1 extends DefaultLightGodwoken {
  getVersion(): GodwokenVersion {
    return GodwokenVersion.V1;
  }

  withdrawWithEvent(payload: WithdrawalEventEmitterPayload): WithdrawalEventEmitter {
    const eventEmitter = new EventEmitter();
    this.withdraw(eventEmitter, payload);
    return eventEmitter;
  }

  async withdraw(eventEmitter: EventEmitter, payload: WithdrawalEventEmitterPayload): Promise<void> {
    eventEmitter.emit("sending");
    const godwokenWeb3 = new GodwokenV1(this.provider.config.GW_POLYJUICE_RPC_URL);
    const chainId = await godwokenWeb3.getChainId();
    const ownerCkbAddress = payload.withdrawal_address || this.provider.l1Address;
    const ownerLock = helpers.parseAddress(ownerCkbAddress);
    const ownerLockHash = utils.computeScriptHash(ownerLock);
    const ethAddress = this.provider.l2Address;
    const l2AccountScript: Script = {
      code_hash: SCRIPTS.eth_account_lock.script_type_hash,
      hash_type: "type",
      args: ROLLUP_CONFIG.rollup_type_hash + ethAddress.slice(2),
    };
    const layer2AccountScriptHash = utils.computeScriptHash(l2AccountScript);

    const address = layer2AccountScriptHash.slice(0, 42);
    const balance = await godwokenWeb3.getBalance(CKB_SUDT_ID, address);
    if (BI.from(balance).lt(BI.from(payload.capacity))) {
      throw new Error(`Insufficient balance(${balance}) on Godwoken`);
    }
    const fromId = await godwokenWeb3.getAccountIdByScriptHash(layer2AccountScriptHash);
    const nonce: number = await godwokenWeb3.getNonce(fromId!);

    const rawWithdrawalRequest: RawWithdrawalRequestV1 = {
      chain_id: chainId,
      nonce: BI.from(nonce).toHexString(),
      capacity: payload.capacity,
      amount: payload.amount,
      sudt_script_hash: payload.sudt_script_hash,
      account_script_hash: layer2AccountScriptHash,
      owner_lock_hash: ownerLockHash,
      fee: "0x0",
    };
    const typedMsg = {
      domain: {
        name: "Godwoken",
        version: "1",
        chainId: Number(chainId),
      },
      message: {
        accountScriptHash: layer2AccountScriptHash,
        nonce,
        chainId: Number(chainId),
        fee: 0,
        layer1OwnerLock: {
          codeHash: ownerLock.code_hash,
          hashType: ownerLock.hash_type,
          args: ownerLock.args,
        },
        withdraw: {
          ckbCapacity: BI.from(payload.capacity).toNumber(),
          UDTAmount: BI.from(payload.amount).toNumber(),
          UDTScriptHash: payload.sudt_script_hash,
        },
      },
      primaryType: "Withdrawal" as const,
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
        ],
        Withdrawal: [
          { name: "accountScriptHash", type: "bytes32" },
          { name: "nonce", type: "uint256" },
          { name: "chainId", type: "uint256" },
          { name: "fee", type: "uint256" },
          { name: "layer1OwnerLock", type: "Script" },
          { name: "withdraw", type: "WithdrawalAsset" },
        ],
        Script: [
          { name: "codeHash", type: "bytes32" },
          { name: "hashType", type: "string" },
          { name: "args", type: "bytes" },
        ],
        WithdrawalAsset: [
          { name: "ckbCapacity", type: "uint256" },
          { name: "UDTAmount", type: "uint256" },
          { name: "UDTScriptHash", type: "bytes32" },
        ],
      },
    };
    console.log("typedMsg:", typedMsg);

    let signedMessage = await this.provider.ethereum.request({
      method: "eth_signTypedData_v4",
      params: [this.provider.l2Address, JSON.stringify(typedMsg)],
    });

    // construct WithdrawalRequestExx tra
    const withdrawalReq: WithdrawalRequestV1 = {
      raw: rawWithdrawalRequest,
      signature: signedMessage,
    };
    const withdrawalReqExtra: WithdrawalRequestExtra = {
      request: withdrawalReq,
      owner_lock: ownerLock,
    };
    console.log("WithdrawalRequestExtra:", withdrawalReqExtra);

    // submit WithdrawalRequestExtra
    const result = await godwokenWeb3.submitWithdrawalReqV1(withdrawalReqExtra);
    console.log("result:", result);

    if (result !== null) {
      const errorMessage = (result as any).message;
      if (errorMessage !== undefined && errorMessage !== null) {
        throw new Error(errorMessage);
      }
    }
  }
}
