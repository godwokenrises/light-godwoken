import EventEmitter from "events";
import { debug } from "./debug";
import isEqual from "lodash.isequal";
import * as secp256k1 from "secp256k1";
import { toolkit, utils, core } from "@ckb-lumos/lumos";
import { Cell, Hash, helpers, HexNumber, HexString, Script, BI, Transaction } from "@ckb-lumos/lumos";
import { CellDep, CellWithStatus, DepType, OutPoint, Output, TransactionWithStatus } from "@ckb-lumos/base";
import { getCellDep, getAdvancedSettings, GodwokenVersion, LightGodwokenConfig } from "./config";
import LightGodwokenProvider from "./lightGodwokenProvider";
import {
  DepositPayload,
  GetErc20Balances,
  GetErc20BalancesResult,
  GetL1CkbBalancePayload,
  GetL2CkbBalancePayload,
  GetSudtBalances,
  GetSudtBalancesResult,
  ProxyERC20,
  SUDT,
  WithdrawalEventEmitter,
  WithdrawalEventEmitterPayload,
  LightGodwokenBase,
  UniversalToken,
  DepositRequest,
  DepositEventEmitter,
  PendingDepositTransaction,
  SUDT_CELL_CAPACITY,
  GetSudtBalance,
  DepositResult,
} from "./lightGodwokenType";
import {
  DepositCanceledError,
  DepositCellNotFoundError,
  DepositRejectedError,
  DepositTimeoutError,
  DepositTxNotFoundError,
  Layer1RpcError,
  NotEnoughCapacityError,
  NotEnoughSudtError,
  TransactionSignError,
  WithdrawalTimeoutError,
} from "./constants/error";
import { getTokenList } from "./tokens";

export default abstract class DefaultLightGodwoken implements LightGodwokenBase {
  provider: LightGodwokenProvider;
  constructor(provider: LightGodwokenProvider) {
    this.provider = provider;
  }

  abstract godwokenClient: any;
  abstract getMinimalDepositCapacity(): BI;
  abstract getMinimalWithdrawalCapacity(): BI;
  abstract generateDepositLock(cancelTimeout?: number): Script;
  abstract getNativeAsset(): UniversalToken;
  abstract getChainId(): string | Promise<string>;
  abstract getL2CkbBalance(payload?: GetL2CkbBalancePayload | undefined): Promise<string>;
  abstract getErc20Balances(payload: GetErc20Balances): Promise<GetErc20BalancesResult>;
  abstract getWithdrawal(txHash: Hash): Promise<unknown>;
  abstract getBuiltinErc20List(): ProxyERC20[];
  abstract getBuiltinSUDTList(): SUDT[];
  abstract getDepositHistories(page?: number): Promise<DepositResult[]>;
  // abstract listWithdraw(): Promise<WithdrawResultWithCell[]>;
  abstract getVersion(): GodwokenVersion;
  abstract withdrawWithEvent(payload: WithdrawalEventEmitterPayload): WithdrawalEventEmitter;

  getNetwork() {
    return this.provider.getNetwork();
  }

  getTokenList() {
    return getTokenList(this.getNetwork(), this.getVersion());
  }

  // in milliseconds
  getBlockProduceTime(): number {
    return this.provider.getConfig().layer2Config.BLOCK_PRODUCE_TIME * 1000;
  }

  getWithdrawalWaitBlock(): number {
    return this.provider.getConfig().layer2Config.FINALITY_BLOCKS;
  }

  getAdvancedSettings() {
    const advancedSettings = getAdvancedSettings(this.getNetwork(), this.getVersion());
    return {
      cancelTimeOut: advancedSettings.MIN_CANCEL_DEPOSIT_TIME,
    };
  }

  getCancelTimeout(): number {
    return this.getAdvancedSettings().cancelTimeOut;
  }

  getCkbBlockProduceTime(): number {
    return 7460;
  }

  getBuiltinSUDTMapByTypeHash(): Record<HexString, SUDT> {
    const map: Record<HexString, SUDT> = {};
    this.getBuiltinSUDTList().forEach((sudt) => {
      const typeHash: HexString = utils.computeScriptHash(sudt.type);
      map[typeHash] = sudt;
    });
    return map;
  }

  async getCkbCurrentBlockNumber(): Promise<BI> {
    return BI.from((await this.provider.ckbIndexer.tip()).block_number);
  }

  async getDepositList(): Promise<DepositRequest[]> {
    const depositLock = this.generateDepositLock();
    debug("depositLock", depositLock);
    const ckbCollector = this.provider.ckbIndexer.collector({
      lock: depositLock,
    });
    const currentCkbBlockNumber = await this.getCkbCurrentBlockNumber();
    const depositList: DepositRequest[] = [];
    for await (const cell of ckbCollector.collect()) {
      const amount = cell.data && cell.data !== "0x" ? utils.readBigUInt128LECompatible(cell.data) : BI.from(0);
      depositList.push({
        rawCell: cell,
        blockNumber: BI.from(cell.block_number),
        capacity: BI.from(cell.cell_output.capacity),
        cancelTime: BI.from(this.getCancelTimeout())
          .mul(1000) // milliseconds per second
          .sub(BI.from(currentCkbBlockNumber).sub(BI.from(cell.block_number)).mul(this.getCkbBlockProduceTime())),
        amount,
        sudt: cell.cell_output.type
          ? this.getBuiltinSUDTMapByTypeHash()[utils.computeScriptHash(cell.cell_output.type)]
          : undefined,
      });
    }
    debug(
      "Deposit list: ",
      depositList.map((d) => ({
        blockNumber: d.blockNumber.toNumber(),
        capacity: d.capacity.toNumber(),
        cancelTime: d.cancelTime.toNumber(),
        amount: d.amount.toNumber(),
        sudt: d.sudt,
      })),
    );
    return depositList;
  }

  async cancelDeposit(depositTxHash: string, cancelTimeout: number): Promise<HexString> {
    const depositLock = this.generateDepositLock(cancelTimeout);
    const tx = await this.provider.ckbRpc.get_transaction(depositTxHash);
    if (!tx) {
      throw new DepositTxNotFoundError(depositTxHash, "Deposit transaction not found");
    }
    const txOutputs = tx.transaction.outputs;
    let depositCell: Cell | undefined;
    for (let index = 0; index < txOutputs.length; index++) {
      const output = txOutputs[index];
      if (utils.computeScriptHash(output.lock) === utils.computeScriptHash(depositLock)) {
        depositCell = {
          cell_output: {
            capacity: output.capacity,
            lock: output.lock,
            type: output.type,
          },
          data: tx.transaction.outputs_data[index],
          out_point: {
            tx_hash: depositTxHash,
            index: BI.from(index).toHexString(),
          },
        };
        break;
      }
    }
    if (!depositCell) {
      throw new DepositCellNotFoundError(depositTxHash, "Deposit cell not found");
    }
    let txSkeleton = await this.createCancelDepositTx(depositCell);
    txSkeleton = await this.payTxFee(txSkeleton);
    const transaction = helpers.createTransactionFromSkeleton(txSkeleton);
    // first cell input is owner ckb cell, second input is deposit cell
    transaction.inputs[1].since = `0xc0${BI.from(cancelTimeout).toHexString().slice(2).padStart(14, "0")}`;
    let signedTx = await this.provider.signL1Tx(transaction);
    const txHash = await this.provider.sendL1Transaction(signedTx);
    return txHash;
  }

  async createCancelDepositTx(cell: Cell): Promise<helpers.TransactionSkeletonType> {
    let txSkeleton = helpers.TransactionSkeleton({ cellProvider: this.provider.ckbIndexer });
    const outputCells: Cell[] = [];
    const inputCells: Cell[] = [cell];
    const inputCapacity = BI.from(cell.cell_output.capacity);
    const ownerLock = this.provider.getLayer1Lock();

    // collect one owner cell
    const ownerCellCollector = this.provider.ckbIndexer.collector({
      lock: ownerLock,
      type: "empty",
      outputDataLenRange: ["0x0", "0x1"],
    });
    let ownerCellCapacity = BI.from(0);
    for await (const cell of ownerCellCollector.collect()) {
      ownerCellCapacity = ownerCellCapacity.add(cell.cell_output.capacity);
      inputCells.unshift(cell);
      break;
    }

    if (!!cell.cell_output.type) {
      outputCells.push({
        cell_output: {
          capacity: BI.from(14400000000).toHexString(),
          lock: ownerLock,
          type: cell.cell_output.type,
        },
        data: cell.data,
      });
      outputCells.push({
        cell_output: {
          capacity: inputCapacity.sub(14400000000).add(ownerCellCapacity).toHexString(),
          lock: ownerLock,
        },
        data: "0x",
      });
    } else {
      outputCells.push({
        cell_output: {
          capacity: inputCapacity.add(ownerCellCapacity).toHexString(),
          lock: ownerLock,
        },
        data: "0x",
      });
    }
    const { layer2Config, layer1Config } = this.provider.getConfig();
    const depositLockDep: CellDep = {
      out_point: {
        tx_hash: layer2Config.SCRIPTS.deposit_lock.cell_dep.out_point.tx_hash,
        index: layer2Config.SCRIPTS.deposit_lock.cell_dep.out_point.index,
      },
      dep_type: layer2Config.SCRIPTS.deposit_lock.cell_dep.dep_type as DepType,
    };
    const rollupCellDep: CellDep = await this.getRollupCellDep();

    txSkeleton = txSkeleton
      .update("inputs", (inputs) => {
        return inputs.push(...inputCells);
      })
      .update("outputs", (outputs) => {
        return outputs.push(...outputCells);
      })
      .update("cellDeps", (cell_deps) => {
        return cell_deps.push(getCellDep(layer1Config.SCRIPTS.omni_lock));
      })
      .update("cellDeps", (cell_deps) => {
        return cell_deps.push(depositLockDep);
      })
      .update("cellDeps", (cell_deps) => {
        return cell_deps.push(rollupCellDep);
      })
      .update("cellDeps", (cell_deps) => {
        return cell_deps.push(getCellDep(layer1Config.SCRIPTS.secp256k1_blake160));
      });

    if (!!cell.cell_output.type) {
      txSkeleton = txSkeleton.update("cellDeps", (cell_deps) => {
        return cell_deps.push(getCellDep(layer1Config.SCRIPTS.sudt));
      });
    }
    return txSkeleton;
  }

  async getRollupCellDep(): Promise<CellDep> {
    const { layer2Config } = this.provider.getConfig();
    const result = await this.godwokenClient.getLastSubmittedInfo();
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

  getConfig(): LightGodwokenConfig {
    return this.provider.getConfig();
  }

  async claimUSDC(): Promise<HexString> {
    return this.provider.claimUSDC();
  }

  async generateDepositTx(
    payload: DepositPayload,
    eventEmiter?: EventEmitter,
  ): Promise<helpers.TransactionSkeletonType> {
    let neededCapacity = BI.from(payload.capacity);
    if (!BI.from(payload.capacity).eq(await this.getL1CkbBalance())) {
      // if user don't deposit all ckb, we will need to collect 64 more ckb for exchange
      neededCapacity = neededCapacity.add(BI.from(64_00000000));
    }
    const neededSudtAmount = payload.amount ? BI.from(payload.amount) : BI.from(0);
    let collectedCapatity = BI.from(0);
    let collectedSudtAmount = BI.from(0);
    const collectedCells: Cell[] = [];
    const ckbCollector = this.provider.ckbIndexer.collector({
      lock: helpers.parseAddress(this.provider.l1Address),
      type: "empty",
      outputDataLenRange: ["0x0", "0x1"],
    });
    for await (const cell of ckbCollector.collect()) {
      collectedCapatity = collectedCapatity.add(BI.from(cell.cell_output.capacity));
      collectedCells.push(cell);
      if (collectedCapatity.gte(neededCapacity)) break;
    }
    if (!!payload.sudtType && neededSudtAmount.gt(BI.from(0))) {
      const userSudtBalance = await this.getSudtBalance({ type: payload.sudtType });
      if (BI.from(userSudtBalance).gt(neededSudtAmount)) {
        // if user don't deposit all sudt, we need to collect more capacity to exchange for sudt
        neededCapacity = neededCapacity.add(BI.from(SUDT_CELL_CAPACITY));
      }
      const sudtCollector = this.provider.ckbIndexer.collector({
        lock: helpers.parseAddress(this.provider.l1Address),
        type: payload.sudtType,
      });
      for await (const cell of sudtCollector.collect()) {
        collectedCapatity = collectedCapatity.add(BI.from(cell.cell_output.capacity));
        collectedSudtAmount = collectedSudtAmount.add(utils.readBigUInt128LECompatible(cell.data));
        collectedCells.push(cell);
        if (collectedSudtAmount.gte(neededSudtAmount)) break;
      }
    }
    // if ckb is not enough, try find some free capacity from sudt cell
    const freeCapacityProviderCells: Cell[] = [];
    if (collectedCapatity.lt(neededCapacity)) {
      const freeCkbCollector = this.provider.ckbIndexer.collector({
        lock: helpers.parseAddress(this.provider.l1Address),
        type: {
          code_hash: this.getConfig().layer1Config.SCRIPTS.sudt.code_hash,
          hash_type: this.getConfig().layer1Config.SCRIPTS.sudt.hash_type,
          args: "0x",
        },
      });
      for await (const cell of freeCkbCollector.collect()) {
        const haveFreeCapacity = BI.from(SUDT_CELL_CAPACITY).lt(cell.cell_output.capacity);
        const alreadyCollected = collectedCells.some((collectedCell) => {
          if (
            isEqual(collectedCell.out_point?.tx_hash, cell.out_point?.tx_hash) &&
            isEqual(collectedCell.out_point?.index, cell.out_point?.index)
          ) {
            return true;
          }
          return false;
        });
        // envolve SUDT cells that has more capacity than SUDT_CELL_CAPACITY
        if (haveFreeCapacity && !alreadyCollected) {
          freeCapacityProviderCells.push(cell);
          collectedCapatity = collectedCapatity.add(cell.cell_output.capacity).sub(SUDT_CELL_CAPACITY);
        }
        if (collectedCapatity.gte(neededCapacity)) {
          break;
        }
      }
    }
    if (collectedCapatity.lt(neededCapacity)) {
      const errorMsg = `Not enough CKB:expected: ${neededCapacity}, actual: ${collectedCapatity}`;
      const error = new NotEnoughCapacityError({ expected: neededCapacity, actual: collectedCapatity }, errorMsg);
      if (eventEmiter) {
        eventEmiter.emit("fail", error);
      }
      throw error;
    }
    if (collectedSudtAmount.lt(neededSudtAmount)) {
      const errorMsg = `Not enough SUDT:expected: ${neededSudtAmount}, actual: ${collectedSudtAmount}`;
      const error = new NotEnoughSudtError({ expected: neededSudtAmount, actual: collectedSudtAmount }, errorMsg);
      if (eventEmiter) {
        eventEmiter.emit("fail", error);
      }
      throw error;
    }

    const outputCell = this.generateDepositOutputCell(collectedCells, freeCapacityProviderCells, payload);
    let txSkeleton = helpers.TransactionSkeleton({ cellProvider: this.provider.ckbIndexer });

    const { layer1Config } = this.provider.getConfig();
    txSkeleton = txSkeleton
      .update("inputs", (inputs) => {
        return inputs.push(...collectedCells, ...freeCapacityProviderCells);
      })
      .update("outputs", (outputs) => {
        return outputs.push(...outputCell);
      })
      .update("cellDeps", (cell_deps) => {
        return cell_deps.push(getCellDep(layer1Config.SCRIPTS.omni_lock));
      })
      .update("cellDeps", (cell_deps) => {
        return cell_deps.push(getCellDep(layer1Config.SCRIPTS.secp256k1_blake160));
      });

    if (payload.sudtType || freeCapacityProviderCells.length > 0) {
      txSkeleton = txSkeleton.update("cellDeps", (cell_deps) => {
        return cell_deps.push(getCellDep(layer1Config.SCRIPTS.sudt));
      });
    }
    return txSkeleton;
  }

  async payTxFee(txSkeleton: helpers.TransactionSkeletonType): Promise<helpers.TransactionSkeletonType> {
    let signedTx = await this.provider.signL1TxSkeleton(txSkeleton, true);
    const txFee = await this.calculateTxFee(signedTx);
    txSkeleton = txSkeleton.update("outputs", (outputs) => {
      const exchagneOutput: Cell = outputs.get(outputs.size - 1)!;
      exchagneOutput.cell_output.capacity = BI.from(exchagneOutput.cell_output.capacity).sub(txFee).toHexString();
      return outputs;
    });
    return txSkeleton;
  }

  async deposit(payload: DepositPayload, eventEmitter?: EventEmitter): Promise<string> {
    let txSkeleton = await this.generateDepositTx(payload, eventEmitter);
    txSkeleton = await this.payTxFee(txSkeleton);
    let signedTx: Transaction;
    try {
      signedTx = await this.provider.signL1TxSkeleton(txSkeleton);
    } catch (e) {
      const error = new TransactionSignError("", "Failed to sign transaction");
      if (eventEmitter) {
        eventEmitter.emit("fail", error);
      }
      throw error;
    }

    let txHash: Hash;
    try {
      txHash = await this.provider.sendL1Transaction(signedTx);
    } catch (e) {
      const error = new Layer1RpcError("", "Failed to send transaction");
      if (eventEmitter) {
        eventEmitter.emit("fail", error);
      }
      throw e;
    }

    if (eventEmitter) {
      eventEmitter.emit("sent", txHash);
      this.waitForDepositToComplete(txHash, eventEmitter);
    }
    return txHash;
  }

  depositWithEvent(payload: DepositPayload): DepositEventEmitter {
    const eventEmitter = new EventEmitter();
    this.deposit(payload, eventEmitter);
    return eventEmitter;
  }

  waitForDepositToComplete(txHash: HexString, eventEmitter: EventEmitter) {
    debug("Waiting for deposit to complete...", txHash);
    const maxLoop = 60;
    let loop = 0;
    let depositTx: TransactionWithStatus | null;
    let depositCellOutPoint: OutPoint | null;
    let depositCell: CellWithStatus | null;

    const nIntervId = setInterval(async () => {
      loop++;
      if (loop > maxLoop) {
        // only when we find the deposit cell, and the deposit cell is not unlocked by user
        if (depositCell && depositCell.status !== "live") {
          eventEmitter.emit("success", txHash);
        } else {
          eventEmitter.emit("fail", new DepositTimeoutError(txHash, "Deposit timeout"));
        }
        clearInterval(nIntervId);
      }

      // 1. wait for deposit tx to be commited
      if (!depositTx) {
        const txOnChain = await this.provider.ckbRpc.get_transaction(txHash as unknown as Hash);
        if (txOnChain && txOnChain.tx_status.status === "committed") {
          depositTx = txOnChain;
          loop = 0;
          debug("depositTx", depositTx);
        }
        if (txOnChain && txOnChain.tx_status.status === "rejected") {
          clearInterval(nIntervId);
          eventEmitter.emit("fail", new DepositRejectedError(txHash, "Deposit rejected"));
        }
      }

      // 2. extract deposit cell outpoint
      if (!!depositTx && !depositCellOutPoint) {
        const txOutputs = depositTx.transaction.outputs;
        for (let index = 0; index < txOutputs.length; index++) {
          const output = txOutputs[index];
          const depositLock = this.generateDepositLock();
          if (
            depositLock.code_hash === output.lock.code_hash &&
            depositLock.hash_type === output.lock.hash_type &&
            depositLock.args === output.lock.args
          ) {
            depositCellOutPoint = {
              tx_hash: txHash,
              index: BI.from(index).toHexString(),
            };
            loop = 0;
            debug("depositCellOutPoint", depositCellOutPoint);
            break;
          }
        }
      }

      // 3. wait for deposit cell to be consumed
      if (depositCellOutPoint) {
        depositCell = await this.provider.ckbRpc.get_live_cell(depositCellOutPoint, false);
        debug("depositCell", depositCell);
      }

      // 4. extract unlocker cell，if output does not contain owner cell, emit success
      if (depositCell && depositCell.status !== "live") {
        const depositLock = await this.generateDepositLock();
        const ownerLock = this.provider.getLayer1Lock();
        const transactions = await this.provider.ckbIndexer.getTransactions({
          script: depositLock,
          script_type: "lock",
        });
        const txHashList = transactions.objects
          .map((object) => object.tx_hash)
          .slice(-10)
          .reverse();
        debug("txHashList", txHashList);
        const promises = txHashList.map(async (txHash) => {
          return this.provider.ckbRpc.get_transaction(txHash as unknown as Hash);
        });
        const txList = await Promise.all(promises);
        for (let index = 0; index < txList.length; index++) {
          const tx = txList[index];
          // eslint-disable-next-line no-loop-func
          const txConsumedDepositCell = tx?.transaction.inputs.some((input) => {
            return (
              input.previous_output.tx_hash === depositCellOutPoint!.tx_hash &&
              input.previous_output.index === depositCellOutPoint!.index
            );
          });
          if (txConsumedDepositCell) {
            // eslint-disable-next-line no-loop-func
            const outputContainsOwnerLock = tx?.transaction.outputs.some((output) => {
              return (
                output.lock.code_hash === ownerLock.code_hash &&
                output.lock.hash_type === ownerLock.hash_type &&
                output.lock.args === ownerLock.args
              );
            });

            if (!outputContainsOwnerLock) {
              debug("deposit committed:", depositTx);
              eventEmitter.emit("success", txHash);
              clearInterval(nIntervId);
            } else {
              debug("deposit canceled:", depositTx);
              eventEmitter.emit("fail", new DepositCanceledError(txHash, "Deposit canceled"));
              clearInterval(nIntervId);
            }
            break;
          }
        }
      }
    }, 10000);
  }

  subscribPendingDepositTransactions(payload: PendingDepositTransaction[]): DepositEventEmitter {
    const eventEmitter = new EventEmitter();
    for (let index = 0; index < payload.length; index++) {
      const element = payload[index];
      this.waitForDepositToComplete(element.tx_hash, eventEmitter);
    }
    return eventEmitter;
  }

  waitForWithdrawalToComplete(txHash: HexString, eventEmitter: WithdrawalEventEmitter) {
    const maxLoop = 30;
    let loop = 0;
    const nIntervId = setInterval(async () => {
      loop++;
      if (loop > maxLoop) {
        eventEmitter.emit("fail", new WithdrawalTimeoutError(txHash, "Withdrawal timeout"));
        clearInterval(nIntervId);
      }
      const withdrawal: any = await this.getWithdrawal(txHash as unknown as Hash);
      if (withdrawal && withdrawal.status === "pending") {
        loop = 0;
        debug("withdrawal pending:", withdrawal);
        eventEmitter.emit("pending", txHash);
      }
      if (withdrawal && withdrawal.status === "committed") {
        debug("withdrawal committed:", txHash, withdrawal);
        eventEmitter.emit("success", txHash);
        clearInterval(nIntervId);
      }
    }, 10000);
  }

  // subscribPendingWithdrawalTransactions(txHashList: Hash[]): WithdrawalEventEmitter {
  //   const eventEmitter = new EventEmitter();
  //   for (let index = 0; index < txHashList.length; index++) {
  //     const txHash = txHashList[index];
  //     this.waitForWithdrawalToComplete(txHash, eventEmitter);
  //   }
  //   return eventEmitter;
  // }

  async calculateTxFee(tx: Transaction): Promise<BI> {
    const feeRate = await this.provider.getMinFeeRate();
    const size = this.getTransactionSizeByTx(tx);
    const fee = this.calculateFeeCompatible(size, feeRate);
    debug(`tx size: ${size}, fee: ${fee}`);
    return fee;
  }

  calculateFeeCompatible(size: number, feeRate: BI): BI {
    const ratio = BI.from(1000);
    const base = BI.from(size).mul(feeRate);
    const fee = base.div(ratio);
    if (fee.mul(ratio).lt(base)) {
      return fee.add(1);
    }
    return BI.from(fee);
  }

  getTransactionSizeByTx(tx: Transaction): number {
    const serializedTx = core.SerializeTransaction(toolkit.normalizers.NormalizeTransaction(tx));
    // 4 is serialized offset bytesize
    const size = serializedTx.byteLength + 4;
    return size;
  }

  /**
   *
   * @param collectedCells CKB cells and SUDT cells that needs to be deposited
   * @param freeCapacityProviderCells other SUDT cells which have more than 142 CKB, so they provide free capacity
   * @param payload deposit payload
   * @returns output cells of this deposit tx
   */
  generateDepositOutputCell(
    collectedCells: Cell[],
    freeCapacityProviderCells: Cell[],
    payload: DepositPayload,
  ): Cell[] {
    const depositLock = this.generateDepositLock();
    let sumCapacity = collectedCells.reduce((acc, cell) => acc.add(cell.cell_output.capacity), BI.from(0));
    // start freeCapacityProviderCells: extract free capacity and return SUDT cell from freeCapacityProviderCells
    const freeCapacity = freeCapacityProviderCells.reduce(
      (acc, cell) => acc.add(cell.cell_output.capacity).sub(SUDT_CELL_CAPACITY),
      BI.from(0),
    );
    sumCapacity = sumCapacity.add(freeCapacity);
    const returnFreeCapacityCells = freeCapacityProviderCells.map((cell) => ({
      ...cell,
      // we don't need block number and out_point in tx output cells
      block_number: undefined,
      out_point: undefined,
      cell_output: { ...cell.cell_output, capacity: BI.from(SUDT_CELL_CAPACITY).toHexString() },
    }));
    // end freeCapacityProviderCells
    const sumSudtAmount = collectedCells.reduce((acc, cell) => {
      if (cell.cell_output.type) {
        return acc.add(utils.readBigUInt128LE(cell.data));
      } else {
        return acc;
      }
    }, BI.from(0));
    const depositCell: Cell = {
      cell_output: {
        capacity: BI.from(payload.capacity).toHexString(),
        lock: depositLock,
      },
      data: "0x",
    };

    const exchangeCapacity = sumCapacity.sub(payload.capacity);
    const exchangeCell: Cell = {
      cell_output: {
        capacity: "0x" + exchangeCapacity.toString(16),
        lock: helpers.parseAddress(this.provider.l1Address),
      },
      data: "0x",
    };

    if (payload.sudtType && payload.amount && payload.amount !== "0x" && payload.amount !== "0x0") {
      depositCell.cell_output.type = payload.sudtType;
      depositCell.data = utils.toBigUInt128LE(payload.amount);
      let outputCells = [...returnFreeCapacityCells, depositCell];

      // contruct sudt exchange cell
      const sudtAmount = utils.toBigUInt128LE(sumSudtAmount.sub(payload.amount));
      const exchangeSudtCell: Cell = {
        cell_output: {
          capacity: "0x0",
          lock: helpers.parseAddress(this.provider.l1Address),
          type: payload.sudtType,
        },
        data: sudtAmount,
      };
      const sudtCapacity = helpers.minimalCellCapacity(exchangeSudtCell);
      exchangeSudtCell.cell_output.capacity = "0x" + sudtCapacity.toString(16);

      // exchange sudt if any left after deposit
      if (BI.from(sudtAmount).gt(BI.from(0))) {
        outputCells = [exchangeSudtCell].concat(...outputCells);
        exchangeCell.cell_output.capacity = exchangeCapacity.sub(sudtCapacity).toHexString();
      } else {
        exchangeCell.cell_output.capacity = `0x${exchangeCapacity.toString(16)}`;
      }

      if (BI.from(exchangeCell.cell_output.capacity).gte(BI.from(6300000000))) {
        outputCells = outputCells.concat(exchangeCell);
      }

      return outputCells;
    } else {
      let outputCells = [...returnFreeCapacityCells, depositCell];
      if (BI.from(exchangeCell.cell_output.capacity).gte(BI.from(6300000000))) {
        outputCells = outputCells.concat(exchangeCell);
      }
      return outputCells;
    }
  }

  async signMessageMetamaskPersonalSign(message: Hash): Promise<HexString> {
    let signedMessage = await this.provider.ethereum.signMessage(message);
    let v = Number.parseInt(signedMessage.slice(-2), 16);
    if (v >= 27) v -= 27;
    signedMessage = "0x" + signedMessage.slice(2, -2) + v.toString(16).padStart(2, "0");
    return signedMessage;
  }

  // TODO: deprecated: https://github.com/ethers-io/ethers.js/issues/2127
  /*async signMessageMetamaskEthSign(message: Hash): Promise<HexString> {
    let signedMessage = await this.provider.ethereum.send("eth_sign", [this.provider.l2Address, message]);
    let v = Number.parseInt(signedMessage.slice(-2), 16);
    if (v >= 27) v -= 27;
    signedMessage = "0x" + signedMessage.slice(2, -2) + v.toString(16).padStart(2, "0");
    return signedMessage;
  }*/

  signMessage(message: Hash, privateKey: HexString): HexString {
    const signObject = secp256k1.ecdsaSign(
      new Uint8Array(new toolkit.Reader(message).toArrayBuffer()),
      new Uint8Array(new toolkit.Reader(privateKey).toArrayBuffer()),
    );
    const signatureBuffer = new ArrayBuffer(65);
    const signatureArray = new Uint8Array(signatureBuffer);
    signatureArray.set(signObject.signature, 0);
    let v = signObject.recid;
    if (v >= 27) {
      v -= 27;
    }
    signatureArray.set([v], 64);

    return new toolkit.Reader(signatureBuffer).serializeJson();
  }

  generateWithdrawalMessageToSign(serializedRawWithdrawalRequest: HexString, rollupTypeHash: Hash): Hash {
    const data = new toolkit.Reader(rollupTypeHash + serializedRawWithdrawalRequest.slice(2)).toArrayBuffer();
    return utils.ckbHash(data).serializeJson();
  }

  minimalWithdrawalCapacity(isSudt: boolean): HexNumber {
    // fixed size, the specific value is not important.
    const dummyHash: Hash = "0x" + "00".repeat(32);
    const dummyHexNumber: HexNumber = "0x0";
    const dummyRollupTypeHash: Hash = dummyHash;
    // const dummyWithdrawalLockArgs: WithdrawalLockArgs = {//192
    //   account_script_hash: dummyHash,//32
    //   withdrawal_block_hash: dummyHash,//32
    //   withdrawal_block_number: dummyHexNumber,//8
    //   sudt_script_hash: dummyHash,//32
    //   sell_amount: dummyHexNumber,//16
    //   sell_capacity: dummyHexNumber,//8
    //   owner_lock_hash: dummyHash,//32
    //   payment_lock_hash: dummyHash,//32
    // };
    // const serialized: HexString = new toolkit.Reader(
    //   SerializeWithdrawalLockArgs(NormalizeWithdrawalLockArgs(dummyWithdrawalLockArgs)),
    // ).serializeJson();
    const dummyWithdrawalLockArgsByteLength = 192;
    // debug("serialized", serialized, serialized.length);
    const args = dummyRollupTypeHash + "00".repeat(dummyWithdrawalLockArgsByteLength);
    const lock: Script = {
      code_hash: dummyHash,
      hash_type: "data",
      args,
    };
    let type: Script | undefined = undefined;
    let data = "0x";
    if (isSudt) {
      type = {
        code_hash: dummyHash,
        hash_type: "data",
        args: dummyHash,
      };
      data = "0x" + "00".repeat(16);
    }
    const cell: Cell = {
      cell_output: {
        lock,
        type,
        capacity: dummyHexNumber,
      },
      data,
    };
    const capacity = helpers.minimalCellCapacity(cell);
    return "0x" + capacity.toString(16);
  }

  async getL1CkbBalance(payload?: GetL1CkbBalancePayload): Promise<HexNumber> {
    return (await this.provider.getL1CkbBalance(payload)).toHexString();
  }

  async getSudtBalance(payload: GetSudtBalance): Promise<HexNumber> {
    const result = await this.getSudtBalances({ types: [payload.type] });
    return result.balances[0];
  }

  async getSudtBalances(payload: GetSudtBalances): Promise<GetSudtBalancesResult> {
    const result: GetSudtBalancesResult = { balances: new Array(payload.types.length).fill("0x0") };
    const sudtTypeScript = payload.types[0]; // any sudt type script
    const collector = this.provider.ckbIndexer.collector({
      lock: helpers.parseAddress(this.provider.l1Address),
      type: {
        ...sudtTypeScript,
        args: "0x",
      },
    });

    // type hash list of all sudt that user want to query
    const typeScriptHashList = payload.types.map((typeScript) => utils.computeScriptHash(typeScript));

    for await (const cell of collector.collect()) {
      const currentCellTypeHash = utils.computeScriptHash(cell.cell_output.type!);
      const currentSudtIndex = typeScriptHashList.indexOf(currentCellTypeHash);
      if (currentSudtIndex !== -1) {
        let currentSudtSum = result.balances[currentSudtIndex];
        result.balances[currentSudtIndex] = BI.from(currentSudtSum)
          .add(utils.readBigUInt128LECompatible(cell.data))
          .toHexString();
      }
    }

    return result;
  }

  /**
   *
   * @param tx
   * @param fromScript
   * @param capacity
   *
   * collect some pure cells and apend them to both input and output sides of the tx.
   * later we can pay tx fee from output side.
   */
  async appendPureCkbCell(
    tx: helpers.TransactionSkeletonType,
    fromScript: Script,
    neededCapacity: BI,
  ): Promise<helpers.TransactionSkeletonType> {
    let collectedSum = BI.from(0);
    const collectedCells: Cell[] = [];
    const collector = this.provider.ckbIndexer.collector({
      lock: fromScript,
      type: "empty",
      outputDataLenRange: ["0x0", "0x1"],
    });
    for await (const cell of collector.collect()) {
      collectedSum = collectedSum.add(cell.cell_output.capacity);
      collectedCells.push(cell);
      if (collectedSum.gte(neededCapacity)) break;
    }
    if (collectedSum.lt(neededCapacity)) {
      const message = `Not enough CKB, expected: ${neededCapacity}, actual: ${collectedSum} `;
      const error = new NotEnoughCapacityError({ expected: neededCapacity, actual: collectedSum }, message);
      throw error;
    }
    const changeOutput: Cell = {
      cell_output: {
        capacity: collectedSum.toHexString(),
        lock: fromScript,
      },
      data: "0x",
    };
    tx = tx.update("inputs", (inputs) => inputs.push(...collectedCells));
    tx = tx.update("outputs", (outputs) => outputs.push(changeOutput));
    return tx;
  }
}
