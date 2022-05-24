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
  Script,
  toolkit,
  utils,
  WitnessArgs,
} from "@ckb-lumos/lumos";
import { Hexadecimal } from "@ckb-lumos/base";
import EventEmitter from "events";
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
  BaseWithdrawalEventEmitterPayload,
  Token,
} from "./lightGodwokenType";
import { SerializeDepositLockArgs, SerializeUnlockWithdrawalViaFinalize } from "./schemas/generated/index.esm";
import { getTokenList } from "./constants/tokens";
import { AbiItems } from "@polyjuice-provider/base";
import { SUDT_ERC20_PROXY_ABI } from "./constants/sudtErc20ProxyAbi";
import { getCellDep } from "./constants/configUtils";
import { GodwokenClient } from "./godwoken/godwoken";
import LightGodwokenProvider from "./lightGodwokenProvider";
import DefaultLightGodwokenProvider from "./lightGodwokenProvider";
import { RawWithdrwal, RawWithdrwalCodec, WithdrawalRequestExtraCodec } from "./schemas/codec";
import { debug, debugProductionEnv } from "./debug";
import { NormalizeDepositLockArgs } from "./godwoken/normalizer";
import DefaultLightGodwokenV1 from "./LightGodwokenV1";
import { NotEnoughCapacityError, NotEnoughSudtError } from "./constants/error";
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

  getNativeAsset(): Token {
    return {
      name: "Common Knowledge Base",
      symbol: "CKB",
      decimals: 8,
      tokenURI: "",
    };
  }

  getBlockProduceTime(): number {
    return 45 * 1000;
  }

  getWithdrawalWaitBlock(): number {
    return 10000;
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
      const withdrawBlockBytes = `0x${rawLockArgs.slice(194, 194 + 16)}`;
      const withdrawBlock = utils.readBigUInt64LECompatible(withdrawBlockBytes).toNumber();
      const containsOwnerLock = rawLockArgs.includes(ownerLockHash.substring(2));
      debug("withdrawBlock is:", withdrawBlock);
      debug("containsOwnerLock is:", containsOwnerLock);

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
    return result;
  }

  withdrawWithEvent(payload: WithdrawalEventEmitterPayload): WithdrawalEventEmitter {
    const eventEmitter = new EventEmitter();
    this.withdraw(eventEmitter, payload);
    return eventEmitter;
  }

  withdrawToV1WithEvent(payload: BaseWithdrawalEventEmitterPayload): WithdrawalEventEmitter {
    const eventEmitter = new EventEmitter();
    this.withdraw(
      eventEmitter,
      { ...payload, withdrawal_address: helpers.encodeToAddress(this.getV1DepositLock()) },
      true,
    );
    return eventEmitter;
  }

  getV1DepositLock(): Script {
    const lightGodwokenV1 = new DefaultLightGodwokenV1(
      new DefaultLightGodwokenProvider(this.provider.l2Address, this.provider.ethereum, "v1"),
    );
    const v1DepositLock = lightGodwokenV1.generateDepositLock();
    return v1DepositLock;
  }

  async withdraw(
    eventEmitter: EventEmitter,
    payload: WithdrawalEventEmitterPayload,
    withdrawToV1 = false,
  ): Promise<void> {
    eventEmitter.emit("sending");
    const { layer2Config } = this.provider.getLightGodwokenConfig();
    const ownerLock = helpers.parseAddress(payload.withdrawal_address || this.provider.l1Address);
    const rawWithdrawalRequest = await this.generateRawWithdrawalRequest(eventEmitter, payload);
    debug("rawWithdrawalRequest:", rawWithdrawalRequest);
    const message = this.generateWithdrawalMessageToSign(
      new toolkit.Reader(RawWithdrwalCodec.pack(rawWithdrawalRequest)).serializeJson(),
      layer2Config.ROLLUP_CONFIG.rollup_type_hash,
    );
    debug("message:", message);
    const signatureMetamaskPersonalSign: HexString = await this.signMessageMetamaskPersonalSign(message);
    debug("signatureMetamaskPersonalSign:", signatureMetamaskPersonalSign);
    const withdrawalRequest = {
      raw: rawWithdrawalRequest,
      signature: signatureMetamaskPersonalSign,
    };

    const withdrawalRequestExtra = {
      request: withdrawalRequest,
      owner_lock: ownerLock,
      withdraw_to_v1: withdrawToV1 ? 1 : 0,
    };

    debug("withdrawalRequestExtra:", withdrawalRequestExtra);
    // using RPC `submitWithdrawalRequest` to submit withdrawal request to godwoken
    let txHash: unknown;
    try {
      txHash = await this.godwokenClient.submitWithdrawalRequest(
        new toolkit.Reader(WithdrawalRequestExtraCodec.pack(withdrawalRequestExtra)).serializeJson(),
      );
    } catch (e) {
      eventEmitter.emit("error", e);
      return;
    }
    eventEmitter.emit("sent", txHash);
    debug("withdrawal request result:", txHash);
    const maxLoop = 100;
    let loop = 0;
    const nIntervId = setInterval(async () => {
      loop++;
      const withdrawal: any = await this.getWithdrawal(txHash as unknown as Hash);
      if (withdrawal && withdrawal.status === "pending") {
        debug("withdrawal pending:", withdrawal);
        eventEmitter.emit("pending", txHash);
      }
      if (withdrawal && withdrawal.status === "committed") {
        debug("withdrawal committed:", withdrawal);
        eventEmitter.emit("success", txHash);
        clearInterval(nIntervId);
      }
      if (withdrawal === null && loop > maxLoop) {
        eventEmitter.emit("fail", txHash);
        debugProductionEnv("withdrawal fail:", txHash);
        clearInterval(nIntervId);
      }
    }, 10000);
  }

  async generateRawWithdrawalRequest(
    eventEmitter: EventEmitter,
    payload: WithdrawalEventEmitterPayload,
  ): Promise<RawWithdrwal> {
    const { layer2Config } = this.provider.getLightGodwokenConfig();
    const rollupTypeHash = layer2Config.ROLLUP_CONFIG.rollup_type_hash;
    const ethAccountTypeHash = layer2Config.SCRIPTS.eth_account_lock.script_type_hash;
    const ownerLock = helpers.parseAddress(payload.withdrawal_address || this.provider.l1Address);
    debug("withdraw owner lock is:", ownerLock);
    const ownerLockHash = utils.computeScriptHash(ownerLock);
    const ethAddress = this.provider.l2Address;
    const l2AccountScript: Script = {
      code_hash: ethAccountTypeHash,
      hash_type: "type",
      args: rollupTypeHash + ethAddress.slice(2),
    };
    const accountScriptHash = utils.computeScriptHash(l2AccountScript);
    debug("accountScriptHash:", accountScriptHash);
    const fromId = await this.godwokenClient.getAccountIdByScriptHash(accountScriptHash);
    debug("fromId:", fromId);
    if (!fromId) {
      throw new Error("account not found");
    }
    let account_script_hash = await this.godwokenClient.getScriptHash(fromId);
    debug("account_script_hash:", account_script_hash);

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
      const error = new NotEnoughCapacityError(
        { expected: BI.from(payload.capacity), actual: BI.from(layer2CkbBalance) },
        errMsg,
      );
      debugProductionEnv(error);
      eventEmitter.emit("error", error);
      throw error;
    }

    if (BI.from(payload.amount).gt(0)) {
      const erc20 = this.getBuiltinErc20ByTypeHash(payload.sudt_script_hash);
      const layer2Erc20Balance = await this.getErc20Balance(erc20.address);
      if (BI.from(payload.amount).gt(layer2Erc20Balance)) {
        const errMsg = `Godwoken Erc20 balance ${BI.from(layer2Erc20Balance).toString()} is less than ${BI.from(
          payload.amount,
        ).toString()}`;
        const error = new NotEnoughSudtError(
          { expected: BI.from(payload.amount), actual: BI.from(layer2Erc20Balance) },
          errMsg,
        );
        debugProductionEnv(error);
        eventEmitter.emit("error", error);
        throw error;
      }
    }

    const nonce: HexNumber = await this.godwokenClient.getNonce(fromId);
    const sellCapacity: HexNumber = "0x0";
    const sellAmount: HexNumber = "0x0";
    const paymentLockHash: HexNumber = "0x" + "00".repeat(32);
    const feeSudtId: HexNumber = "0x1";
    const feeAmount: HexNumber = "0x0";
    const rawWithdrawalRequest = {
      nonce: BI.from(nonce).toNumber(),
      capacity: BI.from(payload.capacity),
      amount: BI.from(payload.amount),
      sudt_script_hash: payload.sudt_script_hash,
      account_script_hash: accountScriptHash,
      sell_amount: BI.from(sellAmount),
      sell_capacity: BI.from(sellCapacity),
      owner_lock_hash: ownerLockHash,
      payment_lock_hash: paymentLockHash,
      fee: {
        sudt_id: BI.from(feeSudtId).toNumber(),
        amount: BI.from(feeAmount),
      },
    };
    debug("rawWithdrawalRequest:", {
      ...rawWithdrawalRequest,
      capacity: rawWithdrawalRequest.capacity.toString(),
      amount: rawWithdrawalRequest.amount.toString(),
      sell_amount: rawWithdrawalRequest.sell_amount.toString(),
      sell_capacity: rawWithdrawalRequest.sell_capacity.toString(),
      fee: {
        ...rawWithdrawalRequest.fee,
        amount: rawWithdrawalRequest.fee.amount.toString(),
      },
    });

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
    // fee paid for this tx should cost no more than 1000 shannon
    const maxTxFee = BI.from(1000);
    txSkeleton = await this.appendPureCkbCell(txSkeleton, l1Lock, maxTxFee);
    let signedTx = await this.provider.signL1TxSkeleton(txSkeleton, true);
    const txFee = await this.calculateTxFee(signedTx);
    txSkeleton = txSkeleton.update("outputs", (outputs) => {
      const exchagneOutput: Cell = outputs.get(outputs.size - 1)!;
      exchagneOutput.cell_output.capacity = BI.from(exchagneOutput.cell_output.capacity).sub(txFee).toHexString();
      return outputs;
    });
    signedTx = await this.provider.signL1TxSkeleton(txSkeleton);
    const txHash = await this.provider.sendL1Transaction(signedTx);
    return txHash;
  }

  generateDepositLock(): Script {
    const ownerLock: Script = helpers.parseAddress(this.provider.l1Address);
    const ownerLockHash: Hash = utils.computeScriptHash(ownerLock);
    const layer2Lock: Script = this.provider.getLayer2LockScript();
    const depositLockArgs = {
      owner_lock_hash: ownerLockHash,
      layer2_lock: layer2Lock,
      cancel_timeout: "0xc0000000000004b0",
      // cancel_timeout: "0xc000000000000001", // min time to test cancel deposit
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
    return depositLock;
  }
}

function isHexStringEqual(strA: string, strB: string) {
  return strA.toLowerCase() === strB.toLowerCase();
}
