import {
  Cell,
  CellDep,
  core,
  DepType,
  Hash,
  helpers,
  HexNumber,
  HexString,
  Script,
  toolkit,
  utils,
  WitnessArgs,
} from "@ckb-lumos/lumos";
import EventEmitter from "events";
import { getLayer2Config } from "./constants/index";
import { OMNI_LOCK_CELL_DEP, SECP256K1_BLACK160_CELL_DEP, SUDT_CELL_DEP } from "./constants/layer1ConfigUtils";
import { RawWithdrawalRequest, WithdrawalRequest } from "./godwoken/normalizer";
import DefaultLightGodwoken from "./lightGodwoken";
import {
  UnlockPayload,
  WithdrawalEventEmitter,
  WithdrawalEventEmitterPayload,
  GodwokenVersion,
  LightGodwokenV0,
} from "./lightGodwokenType";
import { SerializeUnlockWithdrawalViaFinalize } from "./schemas/index.esm";
const { SCRIPTS, ROLLUP_CONFIG } = getLayer2Config();

export default class DefaultLightGodwokenV0 extends DefaultLightGodwoken implements LightGodwokenV0 {
  getVersion(): GodwokenVersion {
    return "v0";
  }

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

  async unlock(payload: UnlockPayload): Promise<Hash> {
    const l1Address = this.provider.l1Address;
    const l1Lock = helpers.parseAddress(l1Address);
    const outputCells: Cell[] = [];
    if (payload.cell.cell_output.type) {
      const dummySudtCell = {
        cell_output: {
          capacity: "0x0",
          lock: l1Lock,
          type: payload.cell.cell_output.type,
        },
        data: payload.cell.data,
      };
      const sudtCapacity: bigint = helpers.minimalCellCapacity(dummySudtCell);
      const capacityLeft = BigInt(payload.cell.cell_output.capacity) - sudtCapacity;

      outputCells.push({
        cell_output: {
          capacity: `0x${capacityLeft.toString(16)}`,
          lock: l1Lock,
        },
        data: "0x",
      });
      outputCells.push({
        cell_output: {
          capacity: `0x${sudtCapacity.toString(16)}`,
          lock: l1Lock,
          type: payload.cell.cell_output.type,
        },
        data: payload.cell.data,
      });
    } else {
      outputCells.push({
        cell_output: {
          capacity: payload.cell.cell_output.capacity,
          lock: l1Lock,
          type: payload.cell.cell_output.type,
        },
        data: payload.cell.data,
      });
    }
    const data =
      "0x00000000" +
      new toolkit.Reader(SerializeUnlockWithdrawalViaFinalize(toolkit.normalizers.NormalizeWitnessArgs({})))
        .serializeJson()
        .slice(2);
    const newWitnessArgs: WitnessArgs = {
      lock: data,
    };
    const withdrawalWitness = new toolkit.Reader(
      core.SerializeWitnessArgs(toolkit.normalizers.NormalizeWitnessArgs(newWitnessArgs)),
    ).serializeJson();

    let txSkeleton = helpers.TransactionSkeleton({ cellProvider: this.provider.ckbIndexer });
    const withdrawalLockDep: CellDep = {
      out_point: {
        tx_hash: SCRIPTS.withdrawal_lock.cell_dep.out_point.tx_hash,
        index: SCRIPTS.withdrawal_lock.cell_dep.out_point.index,
      },
      dep_type: SCRIPTS.withdrawal_lock.cell_dep.dep_type as DepType,
    };
    const rollupCellDep: CellDep = await this.provider.getRollupCellDep();
    txSkeleton = txSkeleton
      .update("inputs", (inputs) => {
        return inputs.push(payload.cell);
      })
      .update("outputs", (outputs) => {
        return outputs.push(...outputCells);
      })
      .update("cellDeps", (cell_deps) => {
        return cell_deps.push(withdrawalLockDep);
      })
      .update("cellDeps", (cell_deps) => {
        return cell_deps.push(rollupCellDep);
      })
      .update("cellDeps", (cell_deps) => {
        return cell_deps.push(OMNI_LOCK_CELL_DEP);
      })
      .update("cellDeps", (cell_deps) => {
        return cell_deps.push(SECP256K1_BLACK160_CELL_DEP);
      })
      .update("witnesses", (witnesses) => {
        return witnesses.push(withdrawalWitness);
      });

    if (payload.cell.cell_output.type) {
      txSkeleton = txSkeleton.update("cellDeps", (cell_deps) => {
        return cell_deps.push(SUDT_CELL_DEP);
      });
    }

    txSkeleton = await this.injectCapacity(txSkeleton, l1Lock, BigInt(0));

    const signedTx = await this.provider.signL1Transaction(txSkeleton);
    const txHash = await this.provider.sendL1Transaction(signedTx);
    return txHash;
  }
}
