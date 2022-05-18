import {
  Cell,
  Hash,
  helpers,
  HexNumber,
  HexString,
  Script,
  toolkit,
  utils,
  BI,
  core,
  Transaction,
} from "@ckb-lumos/lumos";
import * as secp256k1 from "secp256k1";
import { getCellDep } from "./constants/configUtils";
import { NormalizeWithdrawalLockArgs, WithdrawalLockArgs } from "./godwoken/normalizer";
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
  WithdrawResult,
  GodwokenVersion,
  LightGodwokenBase,
  Token,
  DepositRequest,
} from "./lightGodwokenType";
import { SerializeWithdrawalLockArgs } from "./schemas/generated/index.esm";
import { debug, debugProductionEnv } from "./debug";
import { LightGodwokenConfig } from "./constants/configTypes";
import { NotEnoughCapacityError, NotEnoughSudtError } from "./constants/error";
import { CellDep, DepType, Output, TransactionWithStatus } from "@ckb-lumos/base";

const MIN_RELATIVE_TIME = "0xc000000000000001";
export default abstract class DefaultLightGodwoken implements LightGodwokenBase {
  provider: LightGodwokenProvider;
  constructor(provider: LightGodwokenProvider) {
    this.provider = provider;
  }

  abstract godwokenClient: any;
  abstract generateDepositLock(): Script;
  abstract getNativeAsset(): Token;
  abstract getChainId(): string | Promise<string>;
  abstract getL2CkbBalance(payload?: GetL2CkbBalancePayload | undefined): Promise<string>;
  abstract getErc20Balances(payload: GetErc20Balances): Promise<GetErc20BalancesResult>;
  abstract getBlockProduceTime(): number | Promise<number>;
  abstract getWithdrawalWaitBlock(): number | Promise<number>;
  abstract getBuiltinErc20List(): ProxyERC20[];
  abstract getBuiltinSUDTList(): SUDT[];
  abstract listWithdraw(): Promise<WithdrawResult[]>;
  abstract getVersion(): GodwokenVersion;
  abstract withdrawWithEvent(payload: WithdrawalEventEmitterPayload): WithdrawalEventEmitter;

  getCkbBlockProduceTime(): number {
    return 7460;
  }

  async getCkbCurrentBlockNumber(): Promise<BI> {
    return BI.from((await this.provider.ckbIndexer.tip()).block_number);
  }

  async getDepositList(): Promise<DepositRequest[]> {
    const depositLock = this.generateDepositLock();
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
        cancelTime: BI.from(7 * 24) // hours per week
          .mul(3600) // seconds  per hour
          .mul(1000) // milliseconds per second
          .sub(BI.from(currentCkbBlockNumber).sub(BI.from(cell.block_number)).mul(this.getCkbBlockProduceTime())),
        amount,
        sudtTypeHash: cell.cell_output.type ? utils.computeScriptHash(cell.cell_output.type) : `0x${"00".repeat(32)}`,
      });
    }
    debug(
      "Deposit list: ",
      depositList.map((d) => ({
        blockNumber: d.blockNumber.toNumber(),
        capacity: d.capacity.toNumber(),
        cancelTime: d.cancelTime.toNumber(),
        amount: d.amount.toNumber(),
        sudtTypeHash: d.sudtTypeHash,
      })),
    );
    return depositList;
  }

  async cancelDeposit(cell: Cell): Promise<HexString> {
    let txSkeleton = await this.createCancelDepositTx(cell);
    txSkeleton = await this.payTxFee(txSkeleton);
    const transaction = helpers.createTransactionFromSkeleton(txSkeleton);
    transaction.inputs[1].since = MIN_RELATIVE_TIME;
    let signedTx = await this.provider.signL1Tx(transaction);
    const txHash = await this.provider.sendL1Transaction(signedTx);
    debugProductionEnv(`Cancel deposit: ${txHash}`);
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
    const { layer2Config, layer1Config } = this.provider.getLightGodwokenConfig();
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
    const { layer2Config } = this.provider.getLightGodwokenConfig();
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

  async generateDepositTx(payload: DepositPayload): Promise<helpers.TransactionSkeletonType> {
    let neededCapacity = BI.from(payload.capacity);
    if (!BI.from(payload.capacity).eq(await this.provider.getL1CkbBalance())) {
      // if user don't deposit all ckb, we will need to collect 64 more ckb for exchange
      neededCapacity = neededCapacity.add(BI.from(6400000000));
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
    if (collectedCapatity.lt(neededCapacity)) {
      const errorMsg = `Not enough CKB:expected: ${neededCapacity}, actual: ${collectedCapatity}`;
      throw new NotEnoughCapacityError({ expected: neededCapacity, actual: collectedCapatity }, errorMsg);
    }
    if (collectedSudtAmount.lt(neededSudtAmount)) {
      const errorMsg = `Not enough SUDT:expected: ${neededSudtAmount}, actual: ${collectedSudtAmount}`;
      throw new NotEnoughSudtError({ expected: neededCapacity, actual: collectedCapatity }, errorMsg);
    }

    const outputCell = this.generateDepositOutputCell(collectedCells, payload);
    let txSkeleton = helpers.TransactionSkeleton({ cellProvider: this.provider.ckbIndexer });

    const { layer1Config } = this.provider.getLightGodwokenConfig();
    txSkeleton = txSkeleton
      .update("inputs", (inputs) => {
        return inputs.push(...collectedCells);
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

    if (payload.sudtType) {
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

  async deposit(payload: DepositPayload): Promise<string> {
    let txSkeleton = await this.generateDepositTx(payload);
    txSkeleton = await this.payTxFee(txSkeleton);
    let signedTx = await this.provider.signL1TxSkeleton(txSkeleton);
    const txHash = await this.provider.sendL1Transaction(signedTx);
    debugProductionEnv(`Deposit ${txHash}`);
    return txHash;
  }

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

  generateDepositOutputCell(collectedCells: Cell[], payload: DepositPayload): Cell[] {
    const depositLock = this.generateDepositLock();
    const sumCapacity = collectedCells.reduce((acc, cell) => acc.add(cell.cell_output.capacity), BI.from(0));
    const sumSudtAmount = collectedCells.reduce((acc, cell) => {
      if (cell.cell_output.type) {
        return acc.add(utils.readBigUInt128LE(cell.data));
      } else {
        return acc;
      }
    }, BI.from(0));
    const outputCell: Cell = {
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
      outputCell.cell_output.type = payload.sudtType;
      outputCell.data = utils.toBigUInt128LE(payload.amount);
      let outputCells = [outputCell];

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
      let outputCells = [outputCell];
      if (BI.from(exchangeCell.cell_output.capacity).gte(BI.from(6300000000))) {
        outputCells = outputCells.concat(exchangeCell);
      }
      return outputCells;
    }
  }

  async signMessageMetamaskPersonalSign(message: Hash): Promise<HexString> {
    let signedMessage = await this.provider.ethereum.request({
      method: "personal_sign",
      params: [this.provider.l2Address, message],
    });
    let v = Number.parseInt(signedMessage.slice(-2), 16);
    if (v >= 27) v -= 27;
    signedMessage = "0x" + signedMessage.slice(2, -2) + v.toString(16).padStart(2, "0");
    return signedMessage;
  }

  async signMessageMetamaskEthSign(message: Hash): Promise<HexString> {
    let signedMessage = await this.provider.ethereum.request({
      method: "eth_sign",
      params: [this.provider.l2Address, message],
    });
    let v = Number.parseInt(signedMessage.slice(-2), 16);
    if (v >= 27) v -= 27;
    signedMessage = "0x" + signedMessage.slice(2, -2) + v.toString(16).padStart(2, "0");
    return signedMessage;
  }

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

    const signature = new toolkit.Reader(signatureBuffer).serializeJson();
    return signature;
  }

  generateWithdrawalMessageToSign(serializedRawWithdrawalRequest: HexString, rollupTypeHash: Hash): Hash {
    const data = new toolkit.Reader(rollupTypeHash + serializedRawWithdrawalRequest.slice(2)).toArrayBuffer();
    const message = utils.ckbHash(data).serializeJson();
    return message;
  }

  minimalWithdrawalCapacity(isSudt: boolean): HexNumber {
    // fixed size, the specific value is not important.
    const dummyHash: Hash = "0x" + "00".repeat(32);
    const dummyHexNumber: HexNumber = "0x0";
    const dummyRollupTypeHash: Hash = dummyHash;
    const dummyWithdrawalLockArgs: WithdrawalLockArgs = {
      account_script_hash: dummyHash,
      withdrawal_block_hash: dummyHash,
      withdrawal_block_number: dummyHexNumber,
      sudt_script_hash: dummyHash,
      sell_amount: dummyHexNumber,
      sell_capacity: dummyHexNumber,
      owner_lock_hash: dummyHash,
      payment_lock_hash: dummyHash,
    };
    const serialized: HexString = new toolkit.Reader(
      SerializeWithdrawalLockArgs(NormalizeWithdrawalLockArgs(dummyWithdrawalLockArgs)),
    ).serializeJson();
    const args = dummyRollupTypeHash + serialized.slice(2);
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
    const collector = this.provider.ckbIndexer.collector({ lock: helpers.parseAddress(this.provider.l1Address) });
    let collectedSum = BI.from(0);
    for await (const cell of collector.collect()) {
      if (!cell.cell_output.type && (!cell.data || cell.data === "0x" || cell.data === "0x0")) {
        collectedSum = collectedSum.add(cell.cell_output.capacity);
      }
    }
    return "0x" + collectedSum.toString(16);
  }

  async getSudtBalances(payload: GetSudtBalances): Promise<GetSudtBalancesResult> {
    const result: GetSudtBalancesResult = { balances: [] };
    for (let index = 0; index < payload.types.length; index++) {
      const type = payload.types[index];
      const collector = this.provider.ckbIndexer.collector({
        lock: helpers.parseAddress(this.provider.l1Address),
        type,
      });
      let collectedSum = BI.from(0);
      for await (const cell of collector.collect()) {
        collectedSum = collectedSum.add(utils.readBigUInt128LECompatible(cell.data));
      }
      result.balances.push("0x" + collectedSum.toString(16));
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
      throw new Error(`Not enough CKB, expected: ${neededCapacity}, actual: ${collectedSum} `);
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
