import {
  BI,
  Cell,
  CellDep,
  Hash,
  HashType,
  helpers,
  HexNumber,
  HexString,
  Script,
  Transaction,
  core,
  toolkit,
  utils,
  WitnessArgs,
} from "@ckb-lumos/lumos";
import { Hexadecimal } from "@ckb-lumos/base";
import EventEmitter from "events";
import DefaultLightGodwoken from "./lightGodwoken";
import {
  DepositResult,
  GetErc20Balances,
  GetErc20BalancesResult,
  GetL2CkbBalancePayload,
  LightGodwokenV0,
  ProxyERC20,
  SUDT,
  UniversalToken,
  UnlockPayload,
  WithdrawalEventEmitter,
  WithdrawalEventEmitterPayload,
  WithdrawalToV1EventEmitterPayload,
  WithdrawResultV0,
} from "./lightGodwokenType";
import { CKB_SUDT_ID } from "./tokens";
import { AbiItems } from "@polyjuice-provider/base";
import { SUDT_ERC20_PROXY_ABI } from "./constants/sudtErc20ProxyAbi";
import { GodwokenClient } from "./godwoken/godwokenV0";
import LightGodwokenProvider from "./lightGodwokenProvider";
import { RawWithdrawal, RawWithdrawalCodec, V0DepositLockArgs, WithdrawalRequestExtraCodec } from "./schemas/codecV0";
import { debug } from "./debug";
import DefaultLightGodwokenV1 from "./LightGodwokenV1";
import {
  Erc20NotFoundError,
  EthAddressFormatError,
  Layer1RpcError,
  Layer2AccountIdNotFoundError,
  NotEnoughCapacityError,
  NotEnoughSudtError,
  TransactionSignError,
  V0WithdrawTokenNotEnoughError,
} from "./constants/error";
import { BigNumber } from "ethers";
import { setMulticallAddress } from "ethers-multicall";
import { Contract as MulticallContract } from "ethers-multicall/dist/contract";
import { Provider as MulticallProvider } from "ethers-multicall/dist/provider";
import { PolyjuiceJsonRpcProvider } from "@polyjuice-provider/ethers";
import { getCellDep, GodwokenVersion } from "./config";
import { GodwokenScanner } from "./godwokenScanner";

export default class DefaultLightGodwokenV0 extends DefaultLightGodwoken implements LightGodwokenV0 {
  godwokenClient;
  godwokenScannerClient;

  multicallProvider: MulticallProvider | null = null;

  constructor(provider: LightGodwokenProvider) {
    super(provider);
    this.godwokenClient = new GodwokenClient(provider.getConfig().layer2Config.GW_POLYJUICE_RPC_URL);
    this.godwokenScannerClient = new GodwokenScanner(provider.getConfig().layer2Config.SCANNER_API);
  }

  getMinimalDepositCapacity(): BI {
    return BI.from(400).mul(100000000);
  }

  getMinimalWithdrawalCapacity(): BI {
    const minimalCapacity =
      8 + // capacity
      32 + // withdrawal_lock.code_hash
      1 + // withdrawal_lock.hash_type
      303 + // withdrawal_lock.args TODO: explain why this is 303
      32 + // sudt_type.code_hash
      1 + // sudt_type.hash_type
      32 + // sudt_type.args
      16; // sudt_amount

    return BI.from(minimalCapacity).mul(100000000);
  }

  getMinimalWithdrawalToV1Capacity(): BI {
    return BI.from(650).mul(100000000);
  }

  async getChainId(): Promise<HexNumber> {
    return await this.godwokenClient.getChainId();
  }

  getVersion(): GodwokenVersion {
    return GodwokenVersion.V0;
  }

  getNativeAsset(): UniversalToken {
    return {
      name: "Common Knowledge Base",
      symbol: "CKB",
      decimals: 8,
      tokenURI: "",
      uan: "CKB.ckb",
    };
  }

  async getL2CkbBalance(payload?: GetL2CkbBalancePayload): Promise<HexNumber> {
    const balance = await this.provider.web3.eth.getBalance(payload?.l2Address || this.provider.l2Address);
    console.log("getL2CkbBalance", balance);
    return "0x" + Number(balance).toString(16);
  }

  getBuiltinErc20List(): ProxyERC20[] {
    const map: ProxyERC20[] = [];
    const sudtScriptConfig = this.provider.getConfig().layer1Config.SCRIPTS.sudt;
    this.getTokenList().forEach((token) => {
      const tokenL1Script: Script = {
        code_hash: sudtScriptConfig.code_hash,
        hash_type: sudtScriptConfig.hash_type as HashType,
        args: token.l1LockArgs,
      };
      const tokenScriptHash = utils.computeScriptHash(tokenL1Script);
      map.push({
        name: token.layer2DisplayName || token.name,
        symbol: token.symbol,
        uan: token.layer2UAN,
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
      throw new Erc20NotFoundError(sudtTypeHash, `Builtin erc20 not found with sudtTypeHash: ${sudtTypeHash}`);
    }
    return filterd[0];
  }

  getBuiltinSUDTList(): SUDT[] {
    const map: SUDT[] = [];
    const sudtScriptConfig = this.provider.getConfig().layer1Config.SCRIPTS.sudt;
    this.getTokenList().forEach((token) => {
      const tokenL1Script: Script = {
        code_hash: sudtScriptConfig.code_hash,
        hash_type: sudtScriptConfig.hash_type as HashType,
        args: token.l1LockArgs,
      };
      map.push({
        type: tokenL1Script,
        name: token.layer1DisplayName || token.name,
        uan: token.layer1UAN,
        symbol: token.symbol,
        decimals: token.decimals,
        tokenURI: token.tokenURI,
      });
    });
    return map;
  }

  async getErc20Balances(payload: GetErc20Balances): Promise<GetErc20BalancesResult> {
    if (this.getConfig().layer2Config.MULTICALL_ADDRESS) {
      return this.getErc20BalancesViaMulticall(payload);
    }
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

  async getMulticallProvider(): Promise<MulticallProvider | null> {
    const multicallContractAddress = this.getConfig().layer2Config.MULTICALL_ADDRESS;

    if (!multicallContractAddress) {
      return null;
    }

    if (!this.multicallProvider) {
      const chainId = Number(await this.getChainId());
      setMulticallAddress(chainId, multicallContractAddress);
      this.multicallProvider = new MulticallProvider(
        new PolyjuiceJsonRpcProvider(
          {
            web3Url: this.getConfig().layer2Config.GW_POLYJUICE_RPC_URL,
            rollupTypeHash: this.getConfig().layer2Config.ROLLUP_CONFIG.rollup_type_hash,
            ethAccountLockCodeHash: this.getConfig().layer2Config.SCRIPTS.eth_account_lock.script_type_hash,
          },
          this.getConfig().layer2Config.GW_POLYJUICE_RPC_URL,
        ),
        chainId,
      );
    }

    return this.multicallProvider;
  }

  async getErc20BalancesViaMulticall(payload: GetErc20Balances): Promise<GetErc20BalancesResult> {
    const multicall = await this.getMulticallProvider();
    if (!multicall) throw new Error("Cannot find MULTICALL_ADDRESS in the config");

    const godwokenAddress = this.provider.getLayer2LockScriptHash().slice(0, 42);

    const calls = payload.addresses.map((address) =>
      new MulticallContract(address, [
        {
          stateMutability: "view",
          inputs: [{ name: "_owner", type: "address" }],
          name: "balanceOf",
          outputs: [{ name: "balance", type: "uint256" }],
          type: "function",
        },
      ]).balanceOf(godwokenAddress),
    );

    const balances: BigNumber[] = await multicall.all(calls);
    return { balances: balances.map((b) => b.toHexString()) };
  }

  async getErc20Balance(address: HexString): Promise<Hexadecimal> {
    const contract = new this.provider.web3.eth.Contract(SUDT_ERC20_PROXY_ABI as AbiItems, address);
    return await contract.methods.balanceOf(this.provider.l2Address).call();
  }

  async getDepositHistories(page?: number): Promise<DepositResult[]> {
    const ethAddress = this.provider.getL2Address();
    const histories = await this.godwokenScannerClient.getDepositHistories(ethAddress, page);
    if (!histories.data.length || (page && histories.meta.total_page < page)) {
      return [];
    }

    return await Promise.all(
      histories.data.map(async (data) => {
        const history = data.attributes;
        const cell = (await this.provider.getLayer1Cell({
          tx_hash: history.layer1_tx_hash,
          index: BI.from(history.layer1_output_index).toHexString(),
        })) as Cell;

        // if GwScan-api (v0) didn't provide `capacity` field,
        // then we need to get it from the target cell
        if (history.capacity === void 0) {
          history.capacity = cell.cell_output.capacity;
        }

        let sudt: SUDT | undefined;
        if (cell?.cell_output.type) {
          const typeHash = utils.computeScriptHash(cell.cell_output.type);
          const typeHashMap = this.getBuiltinSUDTMapByTypeHash();
          sudt = typeHashMap[typeHash];
        }

        return {
          history,
          cell,
          sudt,
          status: "success",
        };
      }),
    );
  }

  async getWithdrawalHistories(page?: number): Promise<WithdrawResultV0[]> {
    const ownerLockHash = await this.provider.getLayer1LockScriptHash();
    return await this.getWithdrawalHistoriesByOwnerLockHash(ownerLockHash, page);
  }

  async getFastWithdrawalHistories(
    lightGodwokenV1: DefaultLightGodwokenV1,
    page?: number,
  ): Promise<WithdrawResultV0[]> {
    const v1DepositLock = lightGodwokenV1.generateDepositLock();
    return await this.getWithdrawalHistoriesByOwnerLockHash(utils.computeScriptHash(v1DepositLock), page);
  }

  async getWithdrawalHistoriesByOwnerLockHash(ownerLockHash: Hash, page?: number): Promise<WithdrawResultV0[]> {
    const histories = await this.godwokenScannerClient.getWithdrawalHistoriesV0(ownerLockHash, page);
    if (!histories.data.length || (page && histories.meta.total_page < page)) {
      return [];
    }

    const lastFinalizedBlockNumber = await this.provider.getLastFinalizedBlockNumber();
    const erc20List = this.getBuiltinErc20List();
    const erc20Map = erc20List.reduce((map: Record<string, ProxyERC20>, row) => {
      map[row.sudt_script_hash.slice(-64)] = row;
      return map;
    }, {});

    const promises = histories.data.map(async (data) => {
      const item = data.attributes;
      const cell = await this.provider.getLayer1Cell({
        tx_hash: item.layer1_tx_hash,
        index: BI.from(item.layer1_output_index).toHexString(),
      });

      let amount = "0x0";
      let erc20 = undefined;
      if (item.udt_id !== CKB_SUDT_ID) {
        amount = BI.from(item.amount).toHexString();
        erc20 = erc20Map[item.udt_script_hash.slice(-64)];
      }

      return {
        cell: cell ?? void 0,
        isFastWithdrawal: item.is_fast_withdrawal,
        layer1TxHash: item.layer1_tx_hash,
        withdrawalBlockNumber: item.block_number,
        remainingBlockNumber: Math.max(0, item.block_number - lastFinalizedBlockNumber),
        capacity: BI.from(item.capacity).toHexString(),
        sudt_script_hash: item.udt_script_hash,
        amount,
        erc20,
        status: item.state,
      };
    });

    return await Promise.all(promises);
  }

  getWithdrawalCellSearchParams(ethAddress: string) {
    if (ethAddress.length !== 42 || !ethAddress.startsWith("0x")) {
      throw new EthAddressFormatError({ address: ethAddress }, "eth address format error!");
    }
    const accountScriptHash = this.provider.getLayer2LockScriptHash();
    const { layer2Config } = this.provider.getConfig();
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

  withdrawToV1WithEvent(payload: WithdrawalToV1EventEmitterPayload): WithdrawalEventEmitter {
    const eventEmitter = new EventEmitter();
    const v1DepositLock = payload.lightGodwoken.generateDepositLock();
    const withdrawalAddress = helpers.encodeToAddress(v1DepositLock, {
      config: this.getConfig().lumosConfig,
    });

    this.withdraw(
      eventEmitter,
      {
        ...payload,
        withdrawal_address: withdrawalAddress,
      },
      true,
    );
    return eventEmitter;
  }

  async withdraw(
    eventEmitter: EventEmitter,
    payload: WithdrawalEventEmitterPayload,
    withdrawToV1 = false,
  ): Promise<void> {
    const { lumosConfig, layer2Config } = this.provider.getConfig();
    const ownerLock = helpers.parseAddress(payload.withdrawal_address || this.provider.l1Address, {
      config: lumosConfig,
    });
    const rawWithdrawalRequest = await this.generateRawWithdrawalRequest(eventEmitter, payload);
    debug("rawWithdrawalRequest:", rawWithdrawalRequest);
    const message = this.generateWithdrawalMessageToSign(
      new toolkit.Reader(RawWithdrawalCodec.pack(rawWithdrawalRequest)).serializeJson(),
      layer2Config.ROLLUP_CONFIG.rollup_type_hash,
    );
    debug("message:", message);
    let signatureMetamaskPersonalSign: HexString = "";
    try {
      signatureMetamaskPersonalSign = await this.signMessageMetamaskPersonalSign(message);
    } catch (e) {
      const error = new TransactionSignError(message, (e as Error).message);
      eventEmitter.emit("fail", error);
      throw error;
    }
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
    let txHash: HexString = "";
    try {
      txHash = (await this.godwokenClient.submitWithdrawalRequest(
        new toolkit.Reader(WithdrawalRequestExtraCodec.pack(withdrawalRequestExtra)).serializeJson(),
      )) as unknown as HexString;
    } catch (error) {
      const rpcError = new V0WithdrawTokenNotEnoughError(JSON.stringify(error), "Send withdrawal failed!");
      eventEmitter.emit("fail", rpcError);
      return;
    }
    if (txHash) {
      eventEmitter.emit("sent", txHash);
      debug("withdrawal request result:", txHash);
      this.waitForWithdrawalToComplete(txHash, eventEmitter);
    }
  }

  async generateRawWithdrawalRequest(
    eventEmitter: EventEmitter,
    payload: WithdrawalEventEmitterPayload,
  ): Promise<RawWithdrawal> {
    const ownerLock = helpers.parseAddress(payload.withdrawal_address || this.provider.l1Address, {
      config: this.getConfig().lumosConfig,
    });
    debug("withdraw owner lock is:", ownerLock);
    const ownerLockHash = utils.computeScriptHash(ownerLock);
    const accountScriptHash = this.provider.getLayer2LockScriptHash();
    debug("accountScriptHash:", accountScriptHash);
    const fromId = await this.godwokenClient.getAccountIdByScriptHash(accountScriptHash);
    debug("fromId:", fromId);
    if (!fromId) {
      throw new Layer2AccountIdNotFoundError(accountScriptHash, "account not found");
    }
    let account_script_hash = await this.godwokenClient.getScriptHash(fromId);
    debug("account_script_hash:", account_script_hash);

    const isSudt = !isHexStringEqual(
      payload.sudt_script_hash,
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    );
    const minCapacity = this.minimalWithdrawalCapacity(isSudt);
    if (BI.from(payload.capacity).lt(minCapacity)) {
      const message = `Withdrawal required ${BI.from(minCapacity).toString()} shannons at least, provided ${BI.from(
        payload.capacity,
      ).toString()}.`;
      const error = new NotEnoughCapacityError(
        { expected: BI.from(minCapacity), actual: BI.from(payload.capacity) },
        message,
      );
      eventEmitter.emit("fail", error);
      throw error;
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
      eventEmitter.emit("fail", error);
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
        // (error);
        eventEmitter.emit("fail", error);
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

  async unlock({ cell }: UnlockPayload): Promise<Hash> {
    const isSudtCell = cell.cell_output.type !== void 0;
    const l1Address = this.provider.getL1Address();
    const l1Lock = helpers.parseAddress(l1Address);
    const outputCells: Cell[] = [];

    if (isSudtCell) {
      const sudtCapacity = helpers.minimalCellCapacityCompatible({
        cell_output: {
          capacity: "0x0",
          lock: l1Lock,
          type: cell.cell_output.type,
        },
        data: cell.data,
      });
      const capacityLeft = BI.from(cell.cell_output.capacity).sub(sudtCapacity);

      debug("unlock sudt cell capacity", sudtCapacity, capacityLeft);

      outputCells.push({
        cell_output: {
          capacity: capacityLeft.toHexString(),
          lock: l1Lock,
        },
        data: "0x",
      });
      outputCells.push({
        cell_output: {
          lock: l1Lock,
          type: cell.cell_output.type,
          capacity: `0x${sudtCapacity.toString(16)}`,
        },
        data: cell.data,
      });
    } else {
      outputCells.push({
        cell_output: {
          lock: l1Lock,
          type: cell.cell_output.type,
          capacity: cell.cell_output.capacity,
        },
        data: cell.data,
      });
    }

    const { layer1Config, layer2Config } = this.provider.getConfig();
    const rollupCellDep: CellDep = await this.getRollupCellDep();
    let txSkeleton = helpers.TransactionSkeleton({
      cellProvider: this.provider.ckbIndexer,
    });

    const withdrawalLockCellDep = layer2Config.SCRIPTS.withdrawal_lock.cell_dep;
    const withdrawalLockDep: CellDep = {
      out_point: {
        tx_hash: withdrawalLockCellDep.out_point.tx_hash,
        index: withdrawalLockCellDep.out_point.index,
      },
      dep_type: withdrawalLockCellDep.dep_type,
    };

    // https://github.com/classicalliu/gw-demos/blob/main/src/unlock.ts#L48
    const withdrawalWitness = new toolkit.Reader(
      core.SerializeWitnessArgs(
        toolkit.normalizers.NormalizeWitnessArgs({
          lock: "0x0000000004000000",
        }),
      ),
    ).serializeJson();

    txSkeleton = txSkeleton
      .update("inputs", (inputs) => {
        return inputs.push(cell);
      })
      .update("outputs", (outputs) => {
        return outputs.push(...outputCells);
      })
      .update("cellDeps", (cellDeps) => {
        cellDeps = cellDeps.push(
          withdrawalLockDep,
          rollupCellDep,
          getCellDep(layer1Config.SCRIPTS.omni_lock),
          getCellDep(layer1Config.SCRIPTS.secp256k1_blake160),
        );
        if (isSudtCell) {
          cellDeps = cellDeps.push(getCellDep(layer1Config.SCRIPTS.sudt));
        }

        debug("unlock cellDeps", cellDeps);
        return cellDeps;
      })
      .update("witnesses", (witnesses) => {
        return witnesses.push(withdrawalWitness);
      });

    // fee paid for this tx should cost no more than 1000 shannon
    const maxTxFee = BI.from(1000);
    txSkeleton = await this.appendPureCkbCell(txSkeleton, l1Lock, maxTxFee);
    txSkeleton = await this.payTxFee(txSkeleton);

    // sign tx
    let signedTx: Transaction;
    try {
      debug("before sign unlock tx", txSkeleton);
      signedTx = await this.provider.signL1TxSkeleton(txSkeleton);
    } catch (e) {
      throw new TransactionSignError(txSkeleton.toString(), "Failed to sign transaction");
    }

    // send l1 transaction
    try {
      debug("sending unlock tx", signedTx);
      return await this.provider.sendL1Transaction(signedTx);
    } catch (e) {
      debug("failed to send unlock tx", e);
      throw new Layer1RpcError(signedTx.toString(), "Failed to send transaction");
    }
  }

  generateDepositLock(): Script {
    const { cancelTimeOut } = this.getAdvancedSettings();
    const ownerLock: Script = helpers.parseAddress(this.provider.l1Address, {
      config: this.getConfig().lumosConfig,
    });
    const ownerLockHash: Hash = utils.computeScriptHash(ownerLock);
    const layer2Lock: Script = this.provider.getLayer2LockScript();
    const depositLockArgs = {
      owner_lock_hash: ownerLockHash,
      layer2_lock: layer2Lock,
      cancel_timeout: BI.from(`0xc0${BI.from(cancelTimeOut).toHexString().slice(2).padStart(14, "0")}`),
      // cancel_timeout: BI.from("0xc0000000000004b0"), // default value
      // cancel_timeout: "0xc000000000000001", // min time to test cancel deposit
    };
    const depositLockArgsHexString: HexString = new toolkit.Reader(
      V0DepositLockArgs.pack(depositLockArgs),
    ).serializeJson();
    const { SCRIPTS, ROLLUP_CONFIG } = this.provider.getConfig().layer2Config;
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
