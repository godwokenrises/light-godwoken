import { Cell, Hash, helpers, HexNumber, HexString, Script, toolkit, utils } from "@ckb-lumos/lumos";
import * as secp256k1 from "secp256k1";
import { getCellDep } from "./constants/configUtils";
import {
  NormalizeDepositLockArgs,
  NormalizeRawWithdrawalRequest,
  NormalizeWithdrawalLockArgs,
  RawWithdrawalRequest,
  WithdrawalLockArgs,
} from "./godwoken/normalizer";
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
} from "./lightGodwokenType";
import {
  SerializeDepositLockArgs,
  SerializeRawWithdrawalRequest,
  SerializeWithdrawalLockArgs,
} from "./schemas/index.esm";

export default abstract class DefaultLightGodwoken implements LightGodwokenBase {
  provider: LightGodwokenProvider;
  constructor(provider: LightGodwokenProvider) {
    this.provider = provider;
  }

  abstract getL2CkbBalance(payload?: GetL2CkbBalancePayload | undefined): Promise<string>;
  abstract getErc20Balances(payload: GetErc20Balances): Promise<GetErc20BalancesResult>;
  abstract getBlockProduceTime(): number | Promise<number>;
  abstract getBuiltinErc20List(): ProxyERC20[];
  abstract getBuiltinSUDTList(): SUDT[];
  abstract listWithdraw(): Promise<WithdrawResult[]>;
  abstract getVersion(): GodwokenVersion;
  abstract withdrawWithEvent(payload: WithdrawalEventEmitterPayload): WithdrawalEventEmitter;

  async deposit(payload: DepositPayload): Promise<string> {
    const neededCapacity = BigInt(payload.capacity) + BigInt(6400000000);
    const neededSudtAmount = payload.amount ? BigInt(payload.amount) : BigInt(0);
    let collectedCapatity = BigInt(0);
    let collectedSudtAmount = BigInt(0);
    const collectedCells: Cell[] = [];
    const collector = this.provider.ckbIndexer.collector({ lock: helpers.parseAddress(this.provider.l1Address) });
    for await (const cell of collector.collect()) {
      console.log(cell);
      if (
        !cell.cell_output.type &&
        (!cell.data || cell.data === "0x" || cell.data === "0x0") &&
        collectedCapatity < neededCapacity
      ) {
        collectedCapatity += BigInt(cell.cell_output.capacity);
        collectedCells.push(cell);
        if (collectedCapatity >= neededCapacity && collectedSudtAmount >= neededSudtAmount) break;
      } else if (
        payload.sudtType &&
        payload.sudtType.args === cell.cell_output.type?.args &&
        collectedSudtAmount < neededSudtAmount
      ) {
        collectedCapatity += BigInt(cell.cell_output.capacity);
        collectedSudtAmount += BigInt(utils.readBigUInt128LECompatible(cell.data).toBigInt());
        collectedCells.push(cell);
        if (collectedCapatity >= neededCapacity && collectedSudtAmount >= neededSudtAmount) break;
      }
    }
    if (collectedCapatity < neededCapacity) {
      throw new Error(`Not enough CKB:expected: ${neededCapacity}, actual: ${collectedCapatity} `);
    }
    if (collectedSudtAmount < neededSudtAmount) {
      throw new Error(`Not enough SUDT:expected: ${neededSudtAmount}, actual: ${collectedSudtAmount} `);
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

    const signedTx = await this.provider.signL1Transaction(txSkeleton);
    const txHash = await this.provider.sendL1Transaction(signedTx);
    return txHash;
  }

  generateDepositOutputCell(collectedCells: Cell[], payload: DepositPayload): Cell[] {
    const ownerLock: Script = helpers.parseAddress(this.provider.l1Address);
    const ownerLockHash: Hash = utils.computeScriptHash(ownerLock);
    const layer2Lock: Script = this.provider.getLayer2LockScript();

    const depositLockArgs = {
      owner_lock_hash: ownerLockHash,
      layer2_lock: layer2Lock,
      cancel_timeout: "0xc0000000000004b0",
    };
    const depositLockArgsHexString: HexString = new toolkit.Reader(
      SerializeDepositLockArgs(NormalizeDepositLockArgs(depositLockArgs)),
    ).serializeJson();

    const { SCRIPTS, ROLLUP_CONFIG } = this.provider.getLightGodwokenConfig().layer2Config;

    const depositLock: Script = {
      code_hash: SCRIPTS.deposit_lock.script_type_hash,
      hash_type: "type",
      args: ROLLUP_CONFIG.rollup_type_hash + depositLockArgsHexString.slice(2),
    };
    const sumCapacity = collectedCells.reduce((acc, cell) => acc + BigInt(cell.cell_output.capacity), BigInt(0));
    const sumSustAmount = collectedCells.reduce((acc, cell) => {
      if (cell.cell_output.type) {
        return acc + BigInt(utils.readBigUInt128LE(cell.data));
      } else {
        return acc;
      }
    }, BigInt(0));
    const outputCell: Cell = {
      cell_output: {
        capacity: "0x" + BigInt(payload.capacity).toString(16),
        lock: depositLock,
      },
      data: "0x",
    };

    // pay 0.0001 ckb for tx fee
    const exchangeCapacity = BigInt(sumCapacity - BigInt(payload.capacity) - BigInt(100000));
    const exchangeCell: Cell = {
      cell_output: {
        capacity: "0x" + exchangeCapacity.toString(16),
        lock: helpers.parseAddress(this.provider.l1Address),
      },
      data: "0x",
    };

    if (payload.sudtType && payload.amount && payload.amount !== "0x" && payload.amount !== "0x0") {
      outputCell.cell_output.type = payload.sudtType;
      outputCell.data = utils.toBigUInt128LE(BigInt(payload.amount));

      const sudtData = utils.toBigUInt128LE(sumSustAmount - BigInt(payload.amount));
      const exchangeSudtCell: Cell = {
        cell_output: {
          capacity: "0x0",
          lock: helpers.parseAddress(this.provider.l1Address),
          type: payload.sudtType,
        },
        data: sudtData,
      };
      const sudtCapacity: bigint = helpers.minimalCellCapacity(exchangeSudtCell);

      exchangeSudtCell.cell_output.capacity = "0x" + sudtCapacity.toString(16);

      // minus sudt capacity from exchange cell
      exchangeCell.cell_output.capacity = `0x${(exchangeCapacity - sudtCapacity).toString(16)}`;
      return [outputCell, exchangeCell, exchangeSudtCell];
    }

    return [outputCell, exchangeCell];
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

  generateWithdrawalMessageToSign(rawWithdrawalRequest: RawWithdrawalRequest, rollupTypeHash: Hash): Hash {
    const serializedRawWithdrawalRequest: HexString = new toolkit.Reader(
      SerializeRawWithdrawalRequest(NormalizeRawWithdrawalRequest(rawWithdrawalRequest)),
    ).serializeJson();
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
    const capacity: bigint = helpers.minimalCellCapacity(cell);
    return "0x" + capacity.toString(16);
  }

  async getL1CkbBalance(payload?: GetL1CkbBalancePayload): Promise<HexNumber> {
    const collector = this.provider.ckbIndexer.collector({ lock: helpers.parseAddress(this.provider.l1Address) });
    let collectedSum = BigInt(0);
    for await (const cell of collector.collect()) {
      if (!cell.cell_output.type && (!cell.data || cell.data === "0x" || cell.data === "0x0")) {
        collectedSum += BigInt(cell.cell_output.capacity);
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
      let collectedSum = BigInt(0);
      for await (const cell of collector.collect()) {
        collectedSum += BigInt(utils.readBigUInt128LECompatible(cell.data).toBigInt());
        collectedSum += BigInt(0);
      }
      result.balances.push("0x" + collectedSum.toString(16));
    }
    return result;
  }

  async injectCapacity(
    tx: helpers.TransactionSkeletonType,
    fromScript: Script,
    capacity: bigint,
  ): Promise<helpers.TransactionSkeletonType> {
    // additional 0.001 ckb for tx fee
    // the tx fee could calculated by tx size
    // this is just a simple example
    const neededCapacity = capacity + BigInt(100000);
    let collectedSum = BigInt(0);
    const collectedCells: Cell[] = [];
    const collector = this.provider.ckbIndexer.collector({ lock: fromScript, type: "empty" });
    for await (const cell of collector.collect()) {
      if (!cell.data || cell.data === "0x" || cell.data === "0x0" || cell.data === "0x00") {
        collectedSum += BigInt(cell.cell_output.capacity);
        collectedCells.push(cell);
        if (collectedSum >= neededCapacity) break;
      }
    }
    if (collectedSum < neededCapacity) {
      throw new Error(`Not enough CKB, expected: ${neededCapacity}, actual: ${collectedSum} `);
    }
    const changeOutput: Cell = {
      cell_output: {
        capacity: "0x" + BigInt(collectedSum - neededCapacity).toString(16),
        lock: fromScript,
      },
      data: "0x",
    };
    tx = tx.update("inputs", (inputs) => inputs.push(...collectedCells));
    tx = tx.update("outputs", (outputs) => outputs.push(changeOutput));
    return tx;
  }
}
