import EventEmitter from "events";
import { debug } from "./debug";
import isEqual from "lodash.isequal";
import * as secp256k1 from "secp256k1";
import { utils } from "@ckb-lumos/lumos";
import { bytes, number } from "@ckb-lumos/codec";
import { blockchain } from "@ckb-lumos/base";
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
  L1TransferPayload,
  L1TransactionEventEmitter,
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

export default abstract class DefaultLightGodwoken implements LightGodwokenBase {
  provider: LightGodwokenProvider;
  protected constructor(provider: LightGodwokenProvider) {
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
    return this.provider.getConfig().tokenList;
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
    return BI.from((await this.provider.ckbRpc.getIndexerTip()).blockNumber);
  }

  generateDepositAddress(cancelTimeout?: number) {
    const depositLock = this.generateDepositLock(cancelTimeout);
    return helpers.encodeToAddress(depositLock);
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
      const amount = cell.data && cell.data !== "0x" ? number.Uint128LE.unpack(cell.data) : BI.from(0);
      depositList.push({
        rawCell: cell,
        blockNumber: BI.from(cell.blockNumber),
        capacity: BI.from(cell.cellOutput.capacity),
        cancelTime: BI.from(this.getCancelTimeout())
          .mul(1000) // milliseconds per second
          .sub(BI.from(currentCkbBlockNumber).sub(BI.from(cell.blockNumber)).mul(this.getCkbBlockProduceTime())),
        amount,
        sudt: cell.cellOutput.type
          ? this.getBuiltinSUDTMapByTypeHash()[utils.computeScriptHash(cell.cellOutput.type)]
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
    const tx = await this.provider.ckbRpc.getTransaction(depositTxHash);
    if (!tx) {
      throw new DepositTxNotFoundError(depositTxHash, "Deposit transaction not found");
    }
    const txOutputs = tx.transaction.outputs;
    let depositCell: Cell | undefined;
    for (let index = 0; index < txOutputs.length; index++) {
      const output = txOutputs[index];
      if (utils.computeScriptHash(output.lock) === utils.computeScriptHash(depositLock)) {
        depositCell = {
          cellOutput: {
            capacity: output.capacity,
            lock: output.lock,
            type: output.type,
          },
          data: tx.transaction.outputsData[index],
          outPoint: {
            txHash: depositTxHash,
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
    const inputCapacity = BI.from(cell.cellOutput.capacity);
    const ownerLock = this.provider.getLayer1Lock();

    // collect one owner cell
    const ownerCellCollector = this.provider.ckbIndexer.collector({
      lock: ownerLock,
      type: "empty",
      outputDataLenRange: ["0x0", "0x1"],
    });
    let ownerCellCapacity = BI.from(0);
    for await (const cell of ownerCellCollector.collect()) {
      ownerCellCapacity = ownerCellCapacity.add(cell.cellOutput.capacity);
      inputCells.unshift(cell);
      break;
    }

    if (!!cell.cellOutput.type) {
      outputCells.push({
        cellOutput: {
          capacity: BI.from(14400000000).toHexString(),
          lock: ownerLock,
          type: cell.cellOutput.type,
        },
        data: cell.data,
      });
      outputCells.push({
        cellOutput: {
          capacity: inputCapacity.sub(14400000000).add(ownerCellCapacity).toHexString(),
          lock: ownerLock,
        },
        data: "0x",
      });
    } else {
      outputCells.push({
        cellOutput: {
          capacity: inputCapacity.add(ownerCellCapacity).toHexString(),
          lock: ownerLock,
        },
        data: "0x",
      });
    }
    const { layer2Config, layer1Config } = this.provider.getConfig();
    const depositLockDep: CellDep = {
      outPoint: {
        txHash: layer2Config.SCRIPTS.depositLock.cellDep.outPoint.txHash,
        index: layer2Config.SCRIPTS.depositLock.cellDep.outPoint.index,
      },
      depType: layer2Config.SCRIPTS.depositLock.cellDep.depType as DepType,
    };
    const rollupCellDep: CellDep = await this.getRollupCellDep();

    txSkeleton = txSkeleton
      .update("inputs", (inputs) => {
        return inputs.push(...inputCells);
      })
      .update("outputs", (outputs) => {
        return outputs.push(...outputCells);
      })
      .update("cellDeps", (cellDeps) => {
        return cellDeps.push(getCellDep(layer1Config.SCRIPTS.omniLock));
      })
      .update("cellDeps", (cellDeps) => {
        return cellDeps.push(depositLockDep);
      })
      .update("cellDeps", (cellDeps) => {
        return cellDeps.push(rollupCellDep);
      })
      .update("cellDeps", (cellDeps) => {
        return cellDeps.push(getCellDep(layer1Config.SCRIPTS.secp256k1Blake160));
      });

    if (!!cell.cellOutput.type) {
      txSkeleton = txSkeleton.update("cellDeps", (cellDeps) => {
        return cellDeps.push(getCellDep(layer1Config.SCRIPTS.sudt));
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
      return output.type && utils.computeScriptHash(output.type) === layer2Config.ROLLUP_CONFIG.rollupTypeHash;
    });
    return {
      outPoint: {
        txHash: txHash,
        index: `0x${rollupIndex.toString(16)}`,
      },
      depType: "code",
    };
  }

  async getPendingTransaction(txHash: Hash): Promise<TransactionWithStatus | null> {
    let tx: TransactionWithStatus | null = null;
    // retry 10 times, and sleep 1s
    for (let i = 0; i < 10; i++) {
      tx = await this.provider.ckbRpc.getTransaction(txHash);
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

  async generateDepositTx(
    payload: DepositPayload,
    eventEmitter?: EventEmitter,
  ): Promise<helpers.TransactionSkeletonType> {
    let neededCapacity = BI.from(payload.capacity);
    if (!BI.from(payload.capacity).eq(await this.getL1CkbBalance())) {
      // if user don't deposit all ckb, we will need to collect 64 more ckb for exchange
      neededCapacity = neededCapacity.add(BI.from(64_00000000));
    }
    const neededSudtAmount = payload.amount ? BI.from(payload.amount) : BI.from(0);
    let collectedCapacity = BI.from(0);
    let collectedSudtAmount = BI.from(0);
    const collectedCells: Cell[] = [];
    const ckbCollector = this.provider.transactionManage.collector({
      lock: helpers.parseAddress(this.provider.l1Address, {
        config: this.getConfig().lumosConfig,
      }),
      type: "empty",
      outputDataLenRange: ["0x0", "0x1"],
    });
    for await (const cell of ckbCollector.collect()) {
      collectedCapacity = collectedCapacity.add(BI.from(cell.cellOutput.capacity));
      collectedCells.push(cell);
      if (collectedCapacity.gte(neededCapacity)) break;
    }
    if (!!payload.sudtType && neededSudtAmount.gt(BI.from(0))) {
      const userSudtBalance = await this.getSudtBalance({ type: payload.sudtType });
      if (BI.from(userSudtBalance).gt(neededSudtAmount)) {
        // if user don't deposit all sudt, we need to collect more capacity to exchange for sudt
        neededCapacity = neededCapacity.add(BI.from(SUDT_CELL_CAPACITY));
      }
      const sudtCollector = this.provider.transactionManage.collector({
        lock: helpers.parseAddress(this.provider.l1Address, {
          config: this.getConfig().lumosConfig,
        }),
        type: payload.sudtType,
        // if sudt cell's data has more info than just amount (16 bytes), skip it
        // because we don't know what the extension bytes contain
        outputDataLenRange: ["0x10", "0x11"],
      });
      for await (const cell of sudtCollector.collect()) {
        collectedCapacity = collectedCapacity.add(BI.from(cell.cellOutput.capacity));
        collectedSudtAmount = collectedSudtAmount.add(number.Uint128LE.unpack(cell.data));
        collectedCells.push(cell);
        if (collectedSudtAmount.gte(neededSudtAmount)) break;
      }
    }
    // if ckb is not enough, try find some free capacity from sudt cell
    const freeCapacityProviderCells: Cell[] = [];
    if (collectedCapacity.lt(neededCapacity)) {
      const freeCkbCollector = this.provider.transactionManage.collector({
        lock: helpers.parseAddress(this.provider.l1Address, {
          config: this.getConfig().lumosConfig,
        }),
        type: {
          codeHash: this.getConfig().layer1Config.SCRIPTS.sudt.codeHash,
          hashType: this.getConfig().layer1Config.SCRIPTS.sudt.hashType,
          args: "0x",
        },
        // if sudt cell's data has more info than just amount (16 bytes), skip it
        // because we don't know what the extension bytes contain
        outputDataLenRange: ["0x10", "0x11"],
      });
      for await (const cell of freeCkbCollector.collect()) {
        const haveFreeCapacity = BI.from(SUDT_CELL_CAPACITY).lt(cell.cellOutput.capacity);
        const alreadyCollected = collectedCells.some((collectedCell) => {
          return !!(
            isEqual(collectedCell.outPoint?.txHash, cell.outPoint?.txHash) &&
            isEqual(collectedCell.outPoint?.index, cell.outPoint?.index)
          );
        });
        // envolve SUDT cells that has more capacity than SUDT_CELL_CAPACITY
        if (haveFreeCapacity && !alreadyCollected) {
          freeCapacityProviderCells.push(cell);
          collectedCapacity = collectedCapacity.add(cell.cellOutput.capacity).sub(SUDT_CELL_CAPACITY);
        }
        if (collectedCapacity.gte(neededCapacity)) {
          break;
        }
      }
    }
    if (collectedCapacity.lt(neededCapacity)) {
      const errorMsg = `Not enough CKB:expected: ${neededCapacity}, actual: ${collectedCapacity}`;
      const error = new NotEnoughCapacityError({ expected: neededCapacity, actual: collectedCapacity }, errorMsg);
      if (eventEmitter) {
        eventEmitter.emit("fail", error);
      }
      throw error;
    }
    if (collectedSudtAmount.lt(neededSudtAmount)) {
      const errorMsg = `Not enough SUDT:expected: ${neededSudtAmount}, actual: ${collectedSudtAmount}`;
      const error = new NotEnoughSudtError({ expected: neededSudtAmount, actual: collectedSudtAmount }, errorMsg);
      if (eventEmitter) {
        eventEmitter.emit("fail", error);
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
      .update("cellDeps", (cellDeps) => {
        return cellDeps.push(getCellDep(layer1Config.SCRIPTS.omniLock));
      })
      .update("cellDeps", (cellDeps) => {
        return cellDeps.push(getCellDep(layer1Config.SCRIPTS.secp256k1Blake160));
      });

    if (payload.sudtType || freeCapacityProviderCells.length > 0) {
      txSkeleton = txSkeleton.update("cellDeps", (cellDeps) => {
        return cellDeps.push(getCellDep(layer1Config.SCRIPTS.sudt));
      });
    }
    return txSkeleton;
  }

  async payTxFee(txSkeleton: helpers.TransactionSkeletonType): Promise<helpers.TransactionSkeletonType> {
    let signedTx = await this.provider.signL1TxSkeleton(txSkeleton, true);
    const txFee = await this.calculateTxFee(signedTx);
    txSkeleton = txSkeleton.update("outputs", (outputs) => {
      const exchangeOutput: Cell = outputs.get(outputs.size - 1)!;
      exchangeOutput.cellOutput.capacity = BI.from(exchangeOutput.cellOutput.capacity).sub(txFee).toHexString();
      return outputs;
    });
    return txSkeleton;
  }

  async deposit(
    payload: DepositPayload,
    eventEmitter?: EventEmitter,
    waitForCompletion: boolean = true,
  ): Promise<string> {
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
      if (waitForCompletion) {
        this.waitForDepositToComplete(txHash, eventEmitter);
      }
    }
    return txHash;
  }

  depositWithEvent(payload: DepositPayload, waitForCompletion?: boolean): DepositEventEmitter {
    const eventEmitter = new EventEmitter();
    this.deposit(payload, eventEmitter, waitForCompletion);
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
        const txOnChain = await this.provider.ckbRpc.getTransaction(txHash as unknown as Hash);
        if (txOnChain && txOnChain.txStatus.status === "committed") {
          depositTx = txOnChain;
          loop = 0;
          debug("depositTx", depositTx);
        }
        if (txOnChain && txOnChain.txStatus.status === "rejected") {
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
            depositLock.codeHash === output.lock.codeHash &&
            depositLock.hashType === output.lock.hashType &&
            depositLock.args === output.lock.args
          ) {
            depositCellOutPoint = {
              txHash: txHash,
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
        depositCell = await this.provider.ckbRpc.getLiveCell(depositCellOutPoint, false);
        debug("depositCell", depositCell);
      }

      // 4. extract unlocker cell，if output does not contain owner cell, emit success
      if (depositCell && depositCell.status !== "live") {
        const depositLock = await this.generateDepositLock();
        const ownerLock = this.provider.getLayer1Lock();
        const transactions = await this.provider.ckbIndexer.getTransactions({
          script: depositLock,
          scriptType: "lock",
        });
        const txHashList = transactions.objects
          .map((object) => object.txHash)
          .slice(-10)
          .reverse();
        debug("txHashList", txHashList);
        const promises = txHashList.map(async (txHash) => {
          return this.provider.ckbRpc.getTransaction(txHash as unknown as Hash);
        });
        const txList = await Promise.all(promises);
        for (let index = 0; index < txList.length; index++) {
          const tx = txList[index];
          // eslint-disable-next-line no-loop-func
          const txConsumedDepositCell = tx?.transaction.inputs.some((input) => {
            return (
              input.previousOutput.txHash === depositCellOutPoint!.txHash &&
              input.previousOutput.index === depositCellOutPoint!.index
            );
          });
          if (txConsumedDepositCell) {
            // eslint-disable-next-line no-loop-func
            const outputContainsOwnerLock = tx?.transaction.outputs.some((output) => {
              return (
                output.lock.codeHash === ownerLock.codeHash &&
                output.lock.hashType === ownerLock.hashType &&
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
      this.waitForDepositToComplete(element.txHash, eventEmitter);
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
    const serializedTx = blockchain.Transaction.pack(tx);
    // 4 is serialized offset byte size
    return serializedTx.buffer.byteLength + 4;
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
    let sumCapacity = collectedCells.reduce((acc, cell) => acc.add(cell.cellOutput.capacity), BI.from(0));
    // start freeCapacityProviderCells: extract free capacity and return SUDT cell from freeCapacityProviderCells
    const freeCapacity = freeCapacityProviderCells.reduce(
      (acc, cell) => acc.add(cell.cellOutput.capacity).sub(SUDT_CELL_CAPACITY),
      BI.from(0),
    );
    sumCapacity = sumCapacity.add(freeCapacity);
    const returnFreeCapacityCells = freeCapacityProviderCells.map((cell) => ({
      ...cell,
      // we don't need block number and outPoint in tx output cells
      blockNumber: undefined,
      outPoint: undefined,
      cellOutput: { ...cell.cellOutput, capacity: BI.from(SUDT_CELL_CAPACITY).toHexString() },
    }));
    // end freeCapacityProviderCells
    const sumSudtAmount = collectedCells.reduce((acc, cell) => {
      if (cell.cellOutput.type) {
        return acc.add(number.Uint128LE.unpack(cell.data));
      } else {
        return acc;
      }
    }, BI.from(0));
    const depositCell: Cell = {
      cellOutput: {
        capacity: BI.from(payload.capacity).toHexString(),
        lock: depositLock,
      },
      data: "0x",
    };

    const exchangeCapacity = sumCapacity.sub(payload.capacity);
    const exchangeCell: Cell = {
      cellOutput: {
        capacity: "0x" + exchangeCapacity.toString(16),
        lock: helpers.parseAddress(this.provider.l1Address, {
          config: this.getConfig().lumosConfig,
        }),
      },
      data: "0x",
    };

    if (payload.sudtType && payload.amount && payload.amount !== "0x" && payload.amount !== "0x0") {
      depositCell.cellOutput.type = payload.sudtType;
      depositCell.data = bytes.hexify(number.Uint128LE.pack(payload.amount));
      let outputCells = [...returnFreeCapacityCells, depositCell];

      // contruct sudt exchange cell
      const sudtAmount = bytes.hexify(number.Uint128LE.pack(sumSudtAmount.sub(payload.amount)));
      const exchangeSudtCell: Cell = {
        cellOutput: {
          capacity: "0x0",
          lock: helpers.parseAddress(this.provider.l1Address, {
            config: this.getConfig().lumosConfig,
          }),
          type: payload.sudtType,
        },
        data: sudtAmount,
      };
      const sudtCapacity = helpers.minimalCellCapacity(exchangeSudtCell);
      exchangeSudtCell.cellOutput.capacity = "0x" + sudtCapacity.toString(16);

      // exchange sudt if any left after deposit
      if (BI.from(sudtAmount).gt(BI.from(0))) {
        outputCells = [exchangeSudtCell].concat(...outputCells);
        exchangeCell.cellOutput.capacity = exchangeCapacity.sub(sudtCapacity).toHexString();
      } else {
        exchangeCell.cellOutput.capacity = `0x${exchangeCapacity.toString(16)}`;
      }

      if (BI.from(exchangeCell.cellOutput.capacity).gte(BI.from(6300000000))) {
        outputCells = outputCells.concat(exchangeCell);
      }

      return outputCells;
    } else {
      let outputCells = [...returnFreeCapacityCells, depositCell];
      if (BI.from(exchangeCell.cellOutput.capacity).gte(BI.from(6300000000))) {
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
    const signObject = secp256k1.ecdsaSign(bytes.bytify(message), bytes.bytify(privateKey));
    const signatureBuffer = new ArrayBuffer(65);
    const signatureArray = new Uint8Array(signatureBuffer);
    signatureArray.set(signObject.signature, 0);
    let v = signObject.recid;
    if (v >= 27) {
      v -= 27;
    }
    signatureArray.set([v], 64);
    return bytes.hexify(signatureBuffer);
  }

  generateWithdrawalMessageToSign(serializedRawWithdrawalRequest: HexString, rollupTypeHash: Hash): Hash {
    const data = bytes.bytify(rollupTypeHash + serializedRawWithdrawalRequest.slice(2));
    return utils.ckbHash(data);
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
      codeHash: dummyHash,
      hashType: "data",
      args,
    };
    let type: Script | undefined = undefined;
    let data = "0x";
    if (isSudt) {
      type = {
        codeHash: dummyHash,
        hashType: "data",
        args: dummyHash,
      };
      data = "0x" + "00".repeat(16);
    }
    const cell: Cell = {
      cellOutput: {
        lock,
        type,
        capacity: dummyHexNumber,
      },
      data,
    };
    const capacity = helpers.minimalCellCapacity(cell);
    return "0x" + capacity.toString(16);
  }

  async l1Transfer(payload: L1TransferPayload): Promise<Hash> {
    let unsignedTx = await this.generateL1TransferTx(payload);
    unsignedTx = await this.payTxFee(unsignedTx);

    let signedTx: Transaction;
    try {
      signedTx = await this.provider.signL1TxSkeleton(unsignedTx);
    } catch (e) {
      throw new TransactionSignError((e as Error).message, "Failed to sign transaction");
    }

    debug("signedTx", signedTx);

    let txHash: Hash;
    try {
      txHash = await this.provider.sendL1Transaction(signedTx);
    } catch (e) {
      throw new Layer1RpcError((e as Error).message, "Failed to send transaction");
    }

    return txHash;
  }

  /**
   * The cell collecting & returning strategies in `l1-transfer` and `deposit` are different.
   *
   * ## Capacity collecting:
   * In l1-transfer, the capacity collecting order: free sudt cell > ckb cell.
   * In deposit, the capacity collecting order: ckb cell > free sudt cell.
   *
   * It means in l1-transfer, we will collect as more free sudt cells as possible,
   * while in deposit we collect ckb cells first, and when we cannot find more ckb cells,
   * we collect free sudt cells.
   *
   * ## Free sudt cells returning:
   * In l1-transfer, the returning rule: merge same type of sudt cells into one.
   * In deposit, the returning rule: we return how many cells as we collected.
   *
   * It means if we've collected 2 USDC cells,
   * in l1-transfer we only return 1 USDC cell and the rest of capacity will be return in a ckb cell,
   * while in deposit, we will return 2 USDC cells as we collected.
   */
  async generateL1TransferTx(payload: L1TransferPayload): Promise<helpers.TransactionSkeletonType> {
    const config = this.getConfig();

    const isTransferSudt = payload.sudtType !== void 0;
    const ckbAmount = !isTransferSudt ? payload.amount : BI.from(SUDT_CELL_CAPACITY).toHexString();
    const sudtAmount = isTransferSudt ? payload.amount : "0x0";
    const senderLock = helpers.parseAddress(this.provider.l1Address, {
      config: config.lumosConfig,
    });

    // always need to left 64CKB for exchange of CKB cell
    let neededCkb = BI.from(ckbAmount).add(64_00000000);
    const neededSudt = BI.from(sudtAmount);

    let collectedCkb = BI.from(0);
    let collectedSudt = BI.from(0);
    const collectedCells: Cell[] = [];

    // collect sUDT
    if (isTransferSudt && neededSudt.gt(0)) {
      // if user doesn't transfer all sUDT, collect more CKB to exchange for sUDT
      // add `neededCkb` here instead before here to collect as more free sUDT cells
      const sudtBalance = await this.getSudtBalance({
        type: payload.sudtType!,
      });
      if (neededSudt.lt(BI.from(sudtBalance))) {
        neededCkb = neededCkb.add(SUDT_CELL_CAPACITY);
      }

      const sudtCollector = this.provider.transactionManage.collector({
        lock: senderLock,
        type: payload.sudtType,
        // if sudt cell's data has more info than just amount (16 bytes), skip it
        // because we don't know what the extension bytes contain
      });
      for await (const cell of sudtCollector.collect()) {
        collectedCells.push(cell);
        collectedCkb = collectedCkb.add(BI.from(cell.cellOutput.capacity));
        collectedSudt = collectedSudt.add(number.Uint128LE.unpack(cell.data));
        if (collectedSudt.gte(neededSudt)) {
          break;
        }
      }
    }

    // collect sUDT cells with extra free capacity
    const collectedFreeCells: Cell[] = [];
    if (collectedCkb.lt(neededCkb)) {
      const freeCkbCollector = this.provider.transactionManage.collector({
        lock: senderLock,
        type: {
          codeHash: config.layer1Config.SCRIPTS.sudt.codeHash,
          hashType: config.layer1Config.SCRIPTS.sudt.hashType,
          args: "0x",
        },
        // if sudt cell's data has more info than just amount (16 bytes), skip it
        // because we don't know what the extension bytes contain
        outputDataLenRange: ["0x10", "0x11"],
      });
      for await (const cell of freeCkbCollector.collect()) {
        const hasFreeCkb = BI.from(cell.cellOutput.capacity).gt(SUDT_CELL_CAPACITY);
        const alreadyCollected = collectedCells.some((collected) => {
          return (
            isEqual(collected.outPoint?.txHash, cell.outPoint?.txHash) &&
            isEqual(collected.outPoint?.index, cell.outPoint?.index)
          );
        });

        if (hasFreeCkb && !alreadyCollected) {
          collectedFreeCells.push(cell);
          collectedCkb = collectedCkb.add(cell.cellOutput.capacity).sub(SUDT_CELL_CAPACITY);
        }
        if (collectedCkb.gte(neededCkb)) {
          break;
        }
      }
    }

    // collect CKB
    if (collectedCkb.lt(neededCkb)) {
      const ckbCollector = this.provider.transactionManage.collector({
        lock: senderLock,
        type: "empty",
        outputDataLenRange: ["0x0", "0x1"],
      });
      for await (const cell of ckbCollector.collect()) {
        collectedCkb = collectedCkb.add(BI.from(cell.cellOutput.capacity));
        collectedCells.push(cell);
        if (collectedCkb.gte(neededCkb)) {
          break;
        }
      }
    }

    // if still not enough, throw error
    if (collectedCkb.lt(neededCkb)) {
      const message = `Not enough CKB, expected: ${neededCkb}, actual: ${collectedCkb}`;
      throw new NotEnoughCapacityError({ expected: neededCkb, actual: collectedCkb }, message);
    }
    if (collectedSudt.lt(neededSudt)) {
      const message = `Not enough sUDT, expected: ${neededSudt}, actual: ${collectedSudt}`;
      throw new NotEnoughSudtError({ expected: neededSudt, actual: collectedSudt }, message);
    }

    const outputCells = this.generateL1TransferOutputCells(payload, collectedCells, collectedFreeCells);
    let txSkeleton = helpers.TransactionSkeleton({
      cellProvider: this.provider.ckbIndexer,
    });

    txSkeleton = txSkeleton
      .update("cellDeps", (cellDeps) => {
        const deps = [
          getCellDep(config.layer1Config.SCRIPTS.omniLock),
          getCellDep(config.layer1Config.SCRIPTS.secp256k1Blake160),
        ];
        if (isTransferSudt || collectedFreeCells.length > 0) {
          deps.push(getCellDep(config.layer1Config.SCRIPTS.sudt));
        }
        return cellDeps.push(...deps);
      })
      .update("inputs", (inputs) => {
        return inputs.push(...collectedCells, ...collectedFreeCells);
      })
      .update("outputs", (outputs) => {
        return outputs.push(...outputCells);
      });

    return txSkeleton;
  }

  generateL1TransferOutputCells(payload: L1TransferPayload, collectedCells: Cell[], collectedFreeCells: Cell[]) {
    const config = this.getConfig();
    const minimumCellCapacity = BI.from(63_00000000);
    const minimumSudtCellCapacity = BI.from(SUDT_CELL_CAPACITY);

    const isTransferSudt = payload.sudtType !== void 0;
    const sudtAmount = isTransferSudt ? payload.amount : "0x0";

    // if transferring CKB, ckbAmount should >= 63 CKB,
    // if transferring sUDT, ckbAmount should >= 144 CKB
    const ckbAmount = !isTransferSudt ? payload.amount : minimumSudtCellCapacity.toHexString();
    const senderLock = helpers.parseAddress(this.provider.l1Address, {
      config: config.lumosConfig,
    });

    const collectedCkb = collectedCells.reduce((acc, cell) => acc.add(cell.cellOutput.capacity), BI.from(0));
    const collectedFreeCkb = collectedFreeCells.reduce((acc, cell) => acc.add(cell.cellOutput.capacity), BI.from(0));
    const collectedSudt = collectedCells.reduce((acc, cell) => {
      if (cell.cellOutput.type) {
        return acc.add(number.Uint128LE.unpack(cell.data));
      } else {
        return acc;
      }
    }, BI.from(0));

    const returnSudtCellsMap: Record<HexString, Cell> = {};
    collectedFreeCells.forEach((cell) => {
      const sudtTypeArgs = cell.cellOutput.type!.args;
      if (sudtTypeArgs in returnSudtCellsMap) {
        // if sUDT cell already exist, combine cell.data
        const cellAmount = number.Uint128LE.unpack(cell.data);
        const mapCellAmount = number.Uint128LE.unpack(returnSudtCellsMap[sudtTypeArgs].data);
        returnSudtCellsMap[sudtTypeArgs].data = bytes.hexify(number.Uint128LE.pack(cellAmount.add(mapCellAmount)));
      } else {
        // we don't need blockNumber, bloch_hash and outPoint in tx output cells
        // return free sUDT cells with only minimum capacity
        returnSudtCellsMap[sudtTypeArgs] = {
          data: cell.data,
          cellOutput: {
            ...cell.cellOutput,
            capacity: BI.from(SUDT_CELL_CAPACITY).toHexString(),
          },
        };
      }
    });

    // transfer to target address
    const transferCell: Cell = {
      cellOutput: {
        capacity: ckbAmount,
        lock: helpers.parseAddress(payload.toAddress, {
          config: config.lumosConfig,
        }),
      },
      data: "0x",
    };

    // if transferring sUDT
    if (isTransferSudt && !["0x", "0x0"].includes(sudtAmount)) {
      transferCell.cellOutput.type = payload.sudtType;
      transferCell.data = bytes.hexify(number.Uint128LE.pack(payload.amount));

      const sudtTypeArgs = payload.sudtType!.args;
      const exchangeSudtAmount = collectedSudt.sub(sudtAmount);
      if (exchangeSudtAmount.gt(0)) {
        if (sudtTypeArgs in returnSudtCellsMap) {
          const existFreeCell = returnSudtCellsMap[sudtTypeArgs];
          const existFreeCellAmount = number.Uint128LE.unpack(existFreeCell.data);
          existFreeCell.data = bytes.hexify(number.Uint128LE.pack(existFreeCellAmount.add(exchangeSudtAmount)));
        } else {
          returnSudtCellsMap[sudtTypeArgs] = {
            data: bytes.hexify(number.Uint128LE.pack(exchangeSudtAmount)),
            cellOutput: {
              lock: senderLock,
              type: payload.sudtType,
              capacity: minimumSudtCellCapacity.toHexString(),
            },
          };
        }
      }

      const returnSudtCells = Object.values(returnSudtCellsMap);
      const returnSudtCellsCkb = returnSudtCells.reduce((acc, cell) => acc.add(cell.cellOutput.capacity), BI.from(0));

      const outputCells = [transferCell, ...returnSudtCells];

      const exchangeCkbFromReturnCells = collectedFreeCkb.sub(returnSudtCellsCkb);
      const exchangeCkb = collectedCkb.add(exchangeCkbFromReturnCells).sub(ckbAmount);
      const exchangeShannons = `0x${exchangeCkb.toString(16)}`;

      debug("collectedCells.length", collectedCells.length);
      debug("collectedFreeCells.length", collectedFreeCells.length);
      debug("collectedCkb", collectedCkb.toString());
      debug("collectedFreeCkb", collectedFreeCkb.toString());
      debug("returnSudtCellsCkb", returnSudtCellsCkb.toString());
      debug("exchangeCkb", exchangeCkb.toString());

      if (BI.from(exchangeShannons).gte(minimumCellCapacity)) {
        outputCells.push({
          cellOutput: {
            capacity: exchangeShannons,
            lock: senderLock,
          },
          data: "0x",
        });
      }

      return outputCells;
    } else {
      // transferring CKB
      const returnSudtCells = Object.values(returnSudtCellsMap);
      const returnSudtCellsCkb = returnSudtCells.reduce((acc, cell) => acc.add(cell.cellOutput.capacity), BI.from(0));

      const outputCells = [transferCell, ...returnSudtCells];

      const exchangeCkbFromReturnCells = collectedFreeCkb.sub(returnSudtCellsCkb);
      const exchangeCkb = collectedCkb.add(exchangeCkbFromReturnCells).sub(ckbAmount);
      const exchangeShannons = `0x${exchangeCkb.toString(16)}`;
      if (BI.from(exchangeShannons).gte(minimumCellCapacity)) {
        outputCells.push({
          cellOutput: {
            capacity: exchangeShannons,
            lock: senderLock,
          },
          data: "0x",
        });
      }

      return outputCells;
    }
  }

  subscribePendingL1Transactions(txs: Hash[]): L1TransactionEventEmitter {
    const eventEmitter = new EventEmitter();
    for (let i = 0; i < txs.length; i++) {
      (async () => {
        const txHash = txs[i];
        try {
          await this.provider.waitForL1Transaction(txHash);
          eventEmitter.emit("success", txHash);
        } catch (e) {
          eventEmitter.emit("fail", e);
        }
      })();
    }

    return eventEmitter;
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
      lock: helpers.parseAddress(this.provider.l1Address, {
        config: this.getConfig().lumosConfig,
      }),
      type: {
        ...sudtTypeScript,
        args: "0x",
      },
      // if sudt cell's data has more info than just amount (16 bytes), skip it
      // because we don't know what the extension bytes contain
      outputDataLenRange: ["0x10", "0x11"],
    });

    // type hash list of all sudt that user want to query
    const typeScriptHashList = payload.types.map((typeScript) => utils.computeScriptHash(typeScript));

    for await (const cell of collector.collect()) {
      const currentCellTypeHash = utils.computeScriptHash(cell.cellOutput.type!);
      const currentSudtIndex = typeScriptHashList.indexOf(currentCellTypeHash);
      if (currentSudtIndex !== -1) {
        let currentSudtSum = result.balances[currentSudtIndex];
        result.balances[currentSudtIndex] = BI.from(currentSudtSum)
          .add(number.Uint128LE.unpack(cell.data))
          .toHexString();
      }
    }

    return result;
  }

  /**
   *
   * @param tx
   * @param fromScript
   * @param neededCapacity
   *
   * collect some pure cells and append them to both input and output sides of the tx.
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
      collectedSum = collectedSum.add(cell.cellOutput.capacity);
      collectedCells.push(cell);
      if (collectedSum.gte(neededCapacity)) break;
    }
    if (collectedSum.lt(neededCapacity)) {
      const message = `Not enough CKB, expected: ${neededCapacity}, actual: ${collectedSum} `;
      throw new NotEnoughCapacityError({ expected: neededCapacity, actual: collectedSum }, message);
    }
    const changeOutput: Cell = {
      cellOutput: {
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
