import { Hash, helpers, HexNumber, HexString, Script, utils } from "@ckb-lumos/lumos";

import EventEmitter from "events";
import { ROLLUP_CONFIG, SCRIPTS } from "./constants";
import { RawWithdrawalRequest, WithdrawalRequest } from "./godwoken/normalizer";
import { WithdrawalEventEmitter, WithdrawalEventEmitterPayload } from "./lightGodwokenType";
import DefaultLightGodwoken from "./lightGodwoken";

export default class LightGodwokenV0 extends DefaultLightGodwoken {
  withdrawWithEvent(payload: WithdrawalEventEmitterPayload): WithdrawalEventEmitter {
    const eventEmitter = new EventEmitter();
    this.withdraw(eventEmitter, payload);
    return eventEmitter;
  }

  async withdraw(eventEmitter: EventEmitter, payload: WithdrawalEventEmitterPayload): Promise<void> {
    eventEmitter.emit("sending");
    const rollupTypeHash = ROLLUP_CONFIG.rollup_type_hash;
    const ethAccountTypeHash = SCRIPTS.eth_account_lock.script_type_hash;
    console.log(" helpers.parseAddress(payload.withdrawal_address || this.provider.l1Address)", payload, this.provider);

    const ownerLock = helpers.parseAddress(payload.withdrawal_address || this.provider.l1Address);
    const ownerLockHash = utils.computeScriptHash(ownerLock);
    const ethAddress = this.provider.l2Address;
    const l2AccountScript: Script = {
      code_hash: ethAccountTypeHash,
      hash_type: "type",
      args: rollupTypeHash + ethAddress.slice(2),
    };
    const accountScriptHash = utils.computeScriptHash(l2AccountScript);
    console.log("account script hash:", accountScriptHash);
    const fromId = await this.provider.godwokenClient.getAccountIdByScriptHash(accountScriptHash);
    if (!fromId) {
      throw new Error("account not found");
    }
    const isSudt = payload.sudt_script_hash !== "0x0000000000000000000000000000000000000000000000000000000000000000";
    const minCapacity = this.minimalWithdrawalCapacity(isSudt);
    if (BigInt(payload.capacity) < BigInt(minCapacity)) {
      throw new Error(
        `Withdrawal required ${BigInt(minCapacity)} shannons at least, provided ${BigInt(payload.capacity)}.`,
      );
    }
    const nonce: HexNumber = await this.provider.godwokenClient.getNonce(fromId);
    console.log("nonce:", nonce);
    const sellCapacity: HexNumber = "0x0";
    const sellAmount: HexNumber = "0x0";
    const paymentLockHash: HexNumber = "0x" + "00".repeat(32);
    const feeSudtId: HexNumber = "0x1";
    const feeAmount: HexNumber = "0x0";
    const rawWithdrawalRequest: RawWithdrawalRequest = {
      nonce: "0x" + BigInt(nonce).toString(16),
      capacity: "0x" + BigInt(payload.capacity).toString(16),
      amount: "0x" + BigInt(payload.amount).toString(16),
      sudt_script_hash: payload.sudt_script_hash,
      account_script_hash: accountScriptHash,
      sell_amount: sellAmount,
      sell_capacity: sellCapacity,
      owner_lock_hash: ownerLockHash,
      payment_lock_hash: paymentLockHash,
      fee: {
        sudt_id: feeSudtId,
        amount: feeAmount,
      },
    };
    console.log("rawWithdrawalRequest:", rawWithdrawalRequest);
    const message = this.generateWithdrawalMessageToSign(rawWithdrawalRequest, rollupTypeHash);
    console.log("message:", message);
    const signatureMetamaskPersonalSign: HexString = await this.signMessageMetamaskPersonalSign(message);
    console.log("signatureMetamaskPersonalSign:", signatureMetamaskPersonalSign);
    const withdrawalRequest: WithdrawalRequest = {
      raw: rawWithdrawalRequest,
      signature: signatureMetamaskPersonalSign,
    };
    console.log("withdrawalRequest:", withdrawalRequest);
    // using RPC `submitWithdrawalRequest` to submit withdrawal request to godwoken
    let result: unknown;
    try {
      result = await this.provider.godwokenClient.submitWithdrawalRequest(withdrawalRequest);
    } catch (e) {
      eventEmitter.emit("error", e);
      return;
    }
    eventEmitter.emit("sent", result);
    console.log("withdrawal request result:", result);
    const maxLoop = 100;
    let loop = 0;
    const nIntervId = setInterval(async () => {
      loop++;
      const withdrawal: any = await this.getWithdrawal(result as unknown as Hash);
      if (withdrawal && withdrawal.status === "pending") {
        console.log("withdrawal pending:", withdrawal);
        eventEmitter.emit("pending", result);
      }
      if (withdrawal && withdrawal.status === "committed") {
        console.log("withdrawal committed:", withdrawal);
        eventEmitter.emit("success", result);
        clearInterval(nIntervId);
      }
      if (withdrawal === null && loop > maxLoop) {
        eventEmitter.emit("fail", result);
        clearInterval(nIntervId);
      }
    }, 10000);
  }
}
