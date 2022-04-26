import {
  BI,
  Cell,
  CellDep,
  core,
  DepType,
  Hash,
  HashType,
  helpers,
  HexNumber,
  HexString,
  Output,
  Script,
  toolkit,
  utils,
  WitnessArgs,
} from "@ckb-lumos/lumos";
import { Hexadecimal, TransactionWithStatus } from "@ckb-lumos/base";
import EventEmitter from "events";
import { core as godwokenCore } from "@polyjuice-provider/godwoken";
import { RawWithdrawalRequest, WithdrawalRequest } from "./godwoken/normalizer";
import DefaultLightGodwoken from "./lightGodwoken";
import {
  UnlockPayload,
  WithdrawalEventEmitter,
  WithdrawalEventEmitterPayload,
  GodwokenVersion,
  LightGodwokenV0,
  WithdrawResult,
  ProxyERC20,
  SUDT,
  GetErc20Balances,
  GetErc20BalancesResult,
  GetL2CkbBalancePayload,
} from "./lightGodwokenType";
import { SerializeUnlockWithdrawalViaFinalize } from "./schemas/index.esm";
import { getTokenList } from "./constants/tokens";
import { AbiItems } from "@polyjuice-provider/base";
import { SUDT_ERC20_PROXY_ABI } from "./constants/sudtErc20ProxyAbi";
import { getCellDep } from "./constants/configUtils";
import { GodwokenClient } from "./godwoken/godwoken";
import LightGodwokenProvider from "./lightGodwokenProvider";
import { debug } from "./debug";
export default class DefaultLightGodwokenV0 extends DefaultLightGodwoken implements LightGodwokenV0 {
  godwokenClient;
  constructor(provider: LightGodwokenProvider) {
    super(provider);
    this.godwokenClient = new GodwokenClient(provider.getLightGodwokenConfig().layer2Config.GW_POLYJUICE_RPC_URL);
  }

  async getChainId(): Promise<HexNumber> {
    return await this.godwokenClient.getChainId();
  }

  getVersion(): GodwokenVersion {
    return "v0";
  }
  getBlockProduceTime(): number {
    return 45 * 1000;
  }

  async getL2CkbBalance(payload?: GetL2CkbBalancePayload): Promise<HexNumber> {
    const balance = await this.provider.web3.eth.getBalance(payload?.l2Address || this.provider.l2Address);
    return "0x" + Number(balance).toString(16);
  }

  getBuiltinErc20List(): ProxyERC20[] {
    const map: ProxyERC20[] = [];
    getTokenList().v0.forEach((token) => {
      const tokenL1Script: Script = {
        code_hash: token.l1Lock.code_hash,
        args: token.l1Lock.args,
        hash_type: token.l1Lock.hash_type as HashType,
      };
      const tokenScriptHash = utils.computeScriptHash(tokenL1Script);
      map.push({
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        address: token.address,
        tokenURI: token.tokenURI,
        sudt_script_hash: tokenScriptHash,
      });
    });
    return map;
  }

  getBuiltinErc20ByTypeHash(sudtTypeHash: HexString): ProxyERC20 {
    const list = this.getBuiltinErc20List();
    const filterd = list.filter((item) => {
      return item.sudt_script_hash === sudtTypeHash;
    });
    if (filterd.length === 0) {
      throw new Error(`Builtin erc20 not found with sudtTypeHash: ${sudtTypeHash}`);
    }
    return filterd[0];
  }

  getBuiltinSUDTList(): SUDT[] {
    const map: SUDT[] = [];
    getTokenList().v0.forEach((token) => {
      const tokenL1Script: Script = {
        code_hash: token.l1Lock.code_hash,
        args: token.l1Lock.args,
        hash_type: token.l1Lock.hash_type as HashType,
      };
      map.push({
        type: tokenL1Script,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        tokenURI: token.tokenURI,
      });
    });
    return map;
  }

  async getErc20Balances(payload: GetErc20Balances): Promise<GetErc20BalancesResult> {
    const result: GetErc20BalancesResult = { balances: [] };
    let promises = [];
    for (let index = 0; index < payload.addresses.length; index++) {
      const address = payload.addresses[index];
      const contract = new this.provider.web3.eth.Contract(SUDT_ERC20_PROXY_ABI as AbiItems, address);
      const erc20BalancePromise = contract.methods.balanceOf(this.provider.l2Address).call();
      promises.push(erc20BalancePromise);
    }
    await Promise.all(promises).then((values) => {
      values.forEach((value) => {
        result.balances.push("0x" + Number(value).toString(16));
      });
    });
    return result;
  }

  async getErc20Balance(address: HexString): Promise<Hexadecimal> {
    const contract = new this.provider.web3.eth.Contract(SUDT_ERC20_PROXY_ABI as AbiItems, address);
    return await contract.methods.balanceOf(this.provider.l2Address).call();
  }

  async listWithdraw(): Promise<WithdrawResult[]> {
    const searchParams = this.getWithdrawalCellSearchParams(this.provider.l2Address);
    debug("searchParams is:", searchParams);
    const collectedCells: WithdrawResult[] = [];
    const collector = this.provider.ckbIndexer.collector({ lock: searchParams.script });
    const lastFinalizedBlockNumber = await this.provider.getLastFinalizedBlockNumber();

    const ownerCKBLock = helpers.parseAddress(this.provider.l1Address);
    const ownerLock: Script = {
      code_hash: ownerCKBLock.code_hash,
      args: ownerCKBLock.args,
      hash_type: ownerCKBLock.hash_type as HashType,
    };
    const ownerLockHash = utils.computeScriptHash(ownerLock);
    debug("ownerLockHash is:", ownerLockHash);

    for await (const cell of collector.collect()) {
      const rawLockArgs = cell.cell_output.lock.args;
      const lockArgs = new godwokenCore.WithdrawalLockArgs(new toolkit.Reader(`0x${rawLockArgs.slice(66)}`));

      if (lockArgs == null) {
        continue;
      }

      const withdrawBlock = Number(lockArgs.getWithdrawalBlockNumber().toLittleEndianBigUint64());
      const containsOwnerLock = cell.cell_output.lock.args.includes(ownerLockHash.substring(2));

      let sudtTypeHash = "0x" + "00".repeat(32);
      let erc20: ProxyERC20 | undefined = undefined;
      let amount: HexNumber = "0x0";

      if (cell.cell_output.type) {
        const sudtType: Script = {
          code_hash: cell.cell_output.type.code_hash,
          args: cell.cell_output.type.args,
          hash_type: cell.cell_output.type.hash_type as HashType,
        };
        sudtTypeHash = utils.computeScriptHash(sudtType);
        const builtinErc20List = this.getBuiltinErc20List();
        erc20 = builtinErc20List.find((e) => e.sudt_script_hash === sudtTypeHash);
        amount = `0x${utils.readBigUInt128LE(cell.data).toString(16)}`;
      }

      if (containsOwnerLock) {
        collectedCells.push({
          cell,
          withdrawalBlockNumber: withdrawBlock,
          remainingBlockNumber: Math.max(0, withdrawBlock - lastFinalizedBlockNumber),
          capacity: cell.cell_output.capacity,
          amount,
          sudt_script_hash: sudtTypeHash,
          erc20,
        });
      }
    }
    const sortedWithdrawals = collectedCells.sort((a, b) => {
      return a.withdrawalBlockNumber - b.withdrawalBlockNumber;
    });
    debug("found withdraw cells:", sortedWithdrawals);
    return sortedWithdrawals;
  }

  getWithdrawalCellSearchParams(ethAddress: string) {
    if (ethAddress.length !== 42 || !ethAddress.startsWith("0x")) {
      throw new Error("eth address format error!");
    }
    const accountScriptHash = this.provider.getLayer2LockScriptHash();
    const { layer2Config } = this.provider.getLightGodwokenConfig();
    return {
      script: {
        code_hash: layer2Config.SCRIPTS.withdrawal_lock.script_type_hash,
        hash_type: "type" as HashType,
        args: `${layer2Config.ROLLUP_CONFIG.rollup_type_hash}${accountScriptHash.slice(2)}`,
      },
      script_type: "lock",
    };
  }

  async getWithdrawal(txHash: Hash): Promise<unknown> {
    const result = this.godwokenClient.getWithdrawal(txHash);
    debug("getWithdrawal result:", result);
    return result;
  }

  withdrawWithEvent(payload: WithdrawalEventEmitterPayload): WithdrawalEventEmitter {
    const eventEmitter = new EventEmitter();
    this.withdraw(eventEmitter, payload);
    return eventEmitter;
  }

  async withdraw(eventEmitter: EventEmitter, payload: WithdrawalEventEmitterPayload): Promise<void> {
    eventEmitter.emit("sending");
    const { layer2Config } = this.provider.getLightGodwokenConfig();
    const rawWithdrawalRequest = await this.generateRawWithdrawalRequest(eventEmitter, payload);
    debug("rawWithdrawalRequest:", rawWithdrawalRequest);
    const message = this.generateWithdrawalMessageToSign(
      rawWithdrawalRequest,
      layer2Config.ROLLUP_CONFIG.rollup_type_hash,
    );
    debug("message:", message);
    const signatureMetamaskPersonalSign: HexString = await this.signMessageMetamaskPersonalSign(message);
    debug("signatureMetamaskPersonalSign:", signatureMetamaskPersonalSign);
    const withdrawalRequest: WithdrawalRequest = {
      raw: rawWithdrawalRequest,
      signature: signatureMetamaskPersonalSign,
    };
    debug("withdrawalRequest:", withdrawalRequest);
    // using RPC `submitWithdrawalRequest` to submit withdrawal request to godwoken
    let result: unknown;
    try {
      result = await this.godwokenClient.submitWithdrawalRequest(withdrawalRequest);
    } catch (e) {
      eventEmitter.emit("error", e);
      return;
    }
    eventEmitter.emit("sent", result);
    debug("withdrawal request result:", result);
    const maxLoop = 100;
    let loop = 0;
    const nIntervId = setInterval(async () => {
      loop++;
      const withdrawal: any = await this.getWithdrawal(result as unknown as Hash);
      if (withdrawal && withdrawal.status === "pending") {
        debug("withdrawal pending:", withdrawal);
        eventEmitter.emit("pending", result);
      }
      if (withdrawal && withdrawal.status === "committed") {
        debug("withdrawal committed:", withdrawal);
        eventEmitter.emit("success", result);
        clearInterval(nIntervId);
      }
      if (withdrawal === null && loop > maxLoop) {
        eventEmitter.emit("fail", result);
        clearInterval(nIntervId);
      }
    }, 10000);
  }

  async generateRawWithdrawalRequest(
    eventEmitter: EventEmitter,
    payload: WithdrawalEventEmitterPayload,
  ): Promise<RawWithdrawalRequest> {
    const { layer2Config } = this.provider.getLightGodwokenConfig();
    const rollupTypeHash = layer2Config.ROLLUP_CONFIG.rollup_type_hash;
    const ethAccountTypeHash = layer2Config.SCRIPTS.eth_account_lock.script_type_hash;
    const ownerLock = helpers.parseAddress(payload.withdrawal_address || this.provider.l1Address);
    const ownerLockHash = utils.computeScriptHash(ownerLock);
    const ethAddress = this.provider.l2Address;
    const l2AccountScript: Script = {
      code_hash: ethAccountTypeHash,
      hash_type: "type",
      args: rollupTypeHash + ethAddress.slice(2),
    };
    const accountScriptHash = utils.computeScriptHash(l2AccountScript);
    const fromId = await this.godwokenClient.getAccountIdByScriptHash(accountScriptHash);
    if (!fromId) {
      throw new Error("account not found");
    }
    const isSudt = !isHexStringEqual(
      payload.sudt_script_hash,
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    );
    const minCapacity = this.minimalWithdrawalCapacity(isSudt);
    if (BI.from(payload.capacity).lt(minCapacity)) {
      throw new Error(
        `Withdrawal required ${BI.from(minCapacity).toString()} shannons at least, provided ${BI.from(
          payload.capacity,
        ).toString()}.`,
      );
    }

    const layer2CkbBalance = await this.getL2CkbBalance();
    if (BI.from(payload.capacity).gt(BI.from(layer2CkbBalance))) {
      const errMsg = `Godwoken CKB balance ${BI.from(layer2CkbBalance).toString()} is less than ${BI.from(
        payload.capacity,
      ).toString()}`;
      eventEmitter.emit("error", errMsg);
      throw new Error(errMsg);
    }

    if (BI.from(payload.amount).gt(0)) {
      const erc20 = this.getBuiltinErc20ByTypeHash(payload.sudt_script_hash);
      const layer2Erc20Balance = await this.getErc20Balance(erc20.address);
      if (BI.from(payload.amount).gt(layer2Erc20Balance)) {
        const errMsg = `Godwoken Erc20 balance ${BI.from(layer2Erc20Balance).toString()} is less than ${BI.from(
          payload.amount,
        ).toString()}`;
        eventEmitter.emit("error", errMsg);
        throw new Error(errMsg);
      }
    }

    const nonce: HexNumber = await this.godwokenClient.getNonce(fromId);
    const sellCapacity: HexNumber = "0x0";
    const sellAmount: HexNumber = "0x0";
    const paymentLockHash: HexNumber = "0x" + "00".repeat(32);
    const feeSudtId: HexNumber = "0x1";
    const feeAmount: HexNumber = "0x0";
    const rawWithdrawalRequest: RawWithdrawalRequest = {
      nonce,
      capacity: payload.capacity,
      amount: payload.amount,
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
    return rawWithdrawalRequest;
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
      const sudtCapacity = helpers.minimalCellCapacity(dummySudtCell);
      const capacityLeft = BI.from(payload.cell.cell_output.capacity).sub(sudtCapacity);
      outputCells.push({
        cell_output: {
          capacity: capacityLeft.toHexString(),
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
    const { layer2Config } = this.provider.getLightGodwokenConfig();
    const withdrawalLockDep: CellDep = {
      out_point: {
        tx_hash: layer2Config.SCRIPTS.withdrawal_lock.cell_dep.out_point.tx_hash,
        index: layer2Config.SCRIPTS.withdrawal_lock.cell_dep.out_point.index,
      },
      dep_type: layer2Config.SCRIPTS.withdrawal_lock.cell_dep.dep_type as DepType,
    };
    const rollupCellDep: CellDep = await this.getRollupCellDep();
    const { layer1Config } = this.provider.getLightGodwokenConfig();
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
        return cell_deps.push(getCellDep(layer1Config.SCRIPTS.omni_lock));
      })
      .update("cellDeps", (cell_deps) => {
        return cell_deps.push(getCellDep(layer1Config.SCRIPTS.secp256k1_blake160));
      })
      .update("witnesses", (witnesses) => {
        return witnesses.push(withdrawalWitness);
      });

    if (payload.cell.cell_output.type) {
      txSkeleton = txSkeleton.update("cellDeps", (cell_deps) => {
        return cell_deps.push(getCellDep(layer1Config.SCRIPTS.sudt));
      });
    }
    txSkeleton = await this.appendPureCkbCell(txSkeleton, l1Lock, BI.from(1000));
    let signedTx = await this.provider.signL1Transaction(txSkeleton, true);
    const txFee = await this.calculateTxFee(signedTx);
    txSkeleton = txSkeleton.update("outputs", (outputs) => {
      const exchagneOutput: Cell = outputs.get(outputs.size - 1)!;
      exchagneOutput.cell_output.capacity = BI.from(exchagneOutput.cell_output.capacity).sub(txFee).toHexString();
      return outputs;
    });
    signedTx = await this.provider.signL1Transaction(txSkeleton);
    const txHash = await this.provider.sendL1Transaction(signedTx);
    return txHash;
  }

  async getRollupCellDep(): Promise<CellDep> {
    const { layer2Config } = this.provider.getLightGodwokenConfig();
    const godwokenClient = new GodwokenClient(layer2Config.GW_POLYJUICE_RPC_URL);
    const result = await godwokenClient.getLastSubmittedInfo();
    const txHash = result.transaction_hash;
    const tx = await this.getPendingTransaction(txHash);
    if (tx == null) {
      throw new Error("Last submitted tx not found!");
    }
    let rollupIndex = tx.transaction.outputs.findIndex((output: Output) => {
      return output.type && utils.computeScriptHash(output.type) === layer2Config.ROLLUP_CONFIG.rollup_type_hash;
    });
    return {
      out_point: {
        tx_hash: txHash,
        index: `0x${rollupIndex.toString(16)}`,
      },
      dep_type: "code",
    };
  }

  async getPendingTransaction(txHash: Hash): Promise<TransactionWithStatus | null> {
    let tx: TransactionWithStatus | null = null;
    // retry 10 times, and sleep 1s
    for (let i = 0; i < 10; i++) {
      tx = await this.provider.ckbRpc.get_transaction(txHash);
      if (tx != null) {
        return tx;
      }
      await this.provider.asyncSleep(1000);
    }
    return null;
  }
}
function isHexStringEqual(strA: string, strB: string) {
  return strA.toLowerCase() === strB.toLowerCase();
}
