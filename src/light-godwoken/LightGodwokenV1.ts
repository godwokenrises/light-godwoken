import { GodwokenScanner } from "./godwoken/godwokenScannerV1";
import { helpers, Script, utils, BI, HashType, HexNumber, Hash, toolkit, HexString } from "@ckb-lumos/lumos";
import isEqual from "lodash/isEqual";
import EventEmitter from "events";
import { Godwoken as GodwokenV1 } from "./godwoken/godwokenV1";
import {
  WithdrawalEventEmitter,
  WithdrawalEventEmitterPayload,
  LightGodwokenV1,
  ProxyERC20,
  SUDT,
  GetErc20Balances,
  GetErc20BalancesResult,
  GetL2CkbBalancePayload,
  Token,
  WithdrawResultV1,
  WithdrawResultWithCell,
} from "./lightGodwokenType";
import DefaultLightGodwoken from "./lightGodwoken";
import { CKB_SUDT_ID, getTokenList } from "./constants/tokens";
import ERC20 from "./constants/ERC20.json";
import LightGodwokenProvider from "./lightGodwokenProvider";
import { RawWithdrawalRequestV1, WithdrawalRequestExtraCodec } from "./schemas/codecV1";
import { debug } from "./debug";
import { V1DepositLockArgs } from "./schemas/codecV1";
import {
  EthAddressFormatError,
  Layer2RpcError,
  NotEnoughCapacityError,
  NotEnoughSudtError,
  SudtNotFoundError,
  TransactionSignError,
  V1WithdrawTokenNotEnoughError,
} from "./constants/error";
import { getAdvancedSettings } from "./constants/configManager";
import { GodwokenVersion } from "./constants/configTypes";
import { isMainnet } from "./env";
import { Contract as MulticallContract, Provider as MulticallProvider, setMulticallAddress } from "ethers-multicall";
import { BigNumber, providers } from "ethers";
export default class DefaultLightGodwokenV1 extends DefaultLightGodwoken implements LightGodwokenV1 {
  listWithdraw(): Promise<WithdrawResultWithCell[]> {
    throw new Error("Method not implemented.");
  }
  godwokenClient;
  godwokenScannerClient;

  /**
   * use {@see getMulticallProvider} to instead
   * @private
   */
  private multicallProvider: MulticallProvider | null = null;

  constructor(provider: LightGodwokenProvider) {
    super(provider);
    this.godwokenClient = new GodwokenV1(provider.getLightGodwokenConfig().layer2Config.GW_POLYJUICE_RPC_URL);
    this.godwokenScannerClient = new GodwokenScanner(provider.getLightGodwokenConfig().layer2Config.SCANNER_API);
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
        new providers.JsonRpcProvider(this.getConfig().layer2Config.GW_POLYJUICE_RPC_URL),
        chainId,
      );
    }

    return this.multicallProvider;
  }

  getVersion(): GodwokenVersion {
    return "v1";
  }

  getNativeAsset(): Token {
    return {
      name: "Common Knowledge Base",
      symbol: "CKB",
      decimals: 18,
      tokenURI: "",
    };
  }

  getMinimalDepositCapacity(): BI {
    return BI.from(400).mul(100000000);
  }

  getMinimalWithdrawalCapacity(): BI {
    return BI.from(400).mul(100000000);
  }

  async getL2CkbBalance(payload?: GetL2CkbBalancePayload): Promise<HexNumber> {
    const balance = await this.provider.web3.eth.getBalance(payload?.l2Address || this.provider.l2Address);
    // const balance = await this.godwokenClient.getCkbBalance(payload?.l2Address || this.provider.l2Address);
    return "0x" + Number(balance).toString(16);
  }

  getBuiltinSUDTMapByTypeHash(): Record<HexString, SUDT> {
    const map: Record<HexString, SUDT> = {};
    this.getBuiltinSUDTList().forEach((sudt) => {
      const typeHash: HexString = utils.computeScriptHash(sudt.type);
      map[typeHash] = sudt;
    });
    return map;
  }

  getBuiltinSUDTList(): SUDT[] {
    const sudtList: SUDT[] = [];
    const sudtScriptConfig = this.provider.getConfig().layer1Config.SCRIPTS.sudt;
    getTokenList().v1.forEach((token) => {
      const tokenL1Script: Script = {
        code_hash: sudtScriptConfig.code_hash,
        hash_type: sudtScriptConfig.hash_type as HashType,
        args: token.l1LockArgs,
      };
      sudtList.push({
        type: tokenL1Script,
        name: token.layer1DisplayName || token.name,
        symbol: token.layer1UAN || token.symbol,
        decimals: token.decimals,
        tokenURI: token.tokenURI,
      });
    });
    return sudtList;
  }
  getBuiltinErc20List(): ProxyERC20[] {
    const map: ProxyERC20[] = [];
    const sudtScriptConfig = this.provider.getConfig().layer1Config.SCRIPTS.sudt;
    getTokenList().v1.forEach((token) => {
      const tokenL1Script: Script = {
        code_hash: sudtScriptConfig.code_hash,
        hash_type: sudtScriptConfig.hash_type as HashType,
        args: token.l1LockArgs,
      };
      const tokenScriptHash = utils.computeScriptHash(tokenL1Script);
      map.push({
        id: token.id,
        name: token.layer2DisplayName || token.name,
        symbol: token.layer2UAN || token.symbol,
        decimals: token.decimals,
        address: token.address,
        tokenURI: token.tokenURI,
        sudt_script_hash: tokenScriptHash,
      });
    });
    return map;
  }

  async getErc20BalancesViaMulticall(payload: GetErc20Balances): Promise<GetErc20BalancesResult> {
    const multicall = await this.getMulticallProvider();
    if (!multicall) throw new Error("Cannot find MULTICALL_ADDRESS in the config");

    const calls = payload.addresses.map((address) =>
      new MulticallContract(address, [
        {
          stateMutability: "view",
          inputs: [{ name: "_owner", type: "address" }],
          name: "balanceOf",
          outputs: [{ name: "balance", type: "uint256" }],
          type: "function",
        },
      ]).balanceOf(this.provider.l2Address),
    );

    const balances: BigNumber[] = await multicall.all(calls);
    return { balances: balances.map((b) => b.toHexString()) };
  }

  async getErc20Balances(payload: GetErc20Balances): Promise<GetErc20BalancesResult> {
    if (this.getConfig().layer2Config.MULTICALL_ADDRESS) {
      return this.getErc20BalancesViaMulticall(payload);
    }

    const result: GetErc20BalancesResult = { balances: [] };
    if (!window.ethereum) {
      return result;
    }
    const Contract = require("web3-eth-contract");
    Contract.setProvider(this.provider.getLightGodwokenConfig().layer2Config.GW_POLYJUICE_RPC_URL);

    let promises = [];
    for (let index = 0; index < payload.addresses.length; index++) {
      const address = payload.addresses[index];
      const contract = new Contract(ERC20.abi, address);
      const balance = contract.methods
        .balanceOf(this.provider.l2Address)
        .call({ from: this.provider.l2Address, gasPrice: "0" });
      promises.push(balance);
    }
    await Promise.all(promises).then((values) => {
      values.forEach((value) => {
        result.balances.push("0x" + Number(value).toString(16));
      });
    });
    return result;
  }
  async getErc20Balance(address: string): Promise<string> {
    if (!window.ethereum) {
      return "result";
    }
    const Contract = require("web3-eth-contract");
    Contract.setProvider(this.provider.getLightGodwokenConfig().layer2Config.GW_POLYJUICE_RPC_URL);
    const contract = new Contract(ERC20.abi, address);
    const balance = contract.methods
      .balanceOf(this.provider.l2Address)
      .call({ from: this.provider.l2Address, gasPrice: "0" });
    return balance;
  }

  async listWithdrawWithScannerApi(): Promise<WithdrawResultV1[]> {
    const ownerLockHash = await this.provider.getLayer1LockScriptHash();
    const histories = await this.godwokenScannerClient.getWithdrawalHistories(ownerLockHash);
    const lastFinalizedBlockNumber = await this.provider.getLastFinalizedBlockNumber();
    const collectedWithdrawals: WithdrawResultV1[] = histories.map((item) => {
      let amount = "0x0";
      let erc20 = undefined;
      if (item.udt_id !== CKB_SUDT_ID) {
        amount = BI.from(item.amount).toHexString();
        erc20 = this.getBuiltinErc20List().find(
          (e) => e.sudt_script_hash.slice(-64) === item.udt_script_hash.slice(-64),
        );
      }
      return {
        layer1TxHash: item.layer1_tx_hash,
        withdrawalBlockNumber: item.block_number,
        remainingBlockNumber: Math.max(0, item.block_number - lastFinalizedBlockNumber),
        capacity: BI.from(item.capacity).toHexString(),
        amount,
        sudt_script_hash: item.udt_script_hash,
        erc20,
        status: item.state === "succeed" ? "success" : item.state,
      };
    });
    return collectedWithdrawals;
  }

  getWithdrawalCellSearchParams(ethAddress: string) {
    if (ethAddress.length !== 42 || !ethAddress.startsWith("0x")) {
      throw new EthAddressFormatError({ address: ethAddress }, "eth address format error!");
    }
    const { layer2Config } = this.provider.getLightGodwokenConfig();
    return {
      script: {
        code_hash: layer2Config.SCRIPTS.withdrawal_lock.script_type_hash,
        hash_type: "type" as HashType,
        args: "0x",
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

  async getChainId(): Promise<HexNumber> {
    return this.godwokenClient.getChainId();
  }

  async withdraw(eventEmitter: EventEmitter, payload: WithdrawalEventEmitterPayload): Promise<void> {
    const rawWithdrawalRequest = await this.generateRawWithdrawalRequest(eventEmitter, payload);
    const typedMsg = await this.generateTypedMsg(rawWithdrawalRequest);
    debug("typedMsg:", typedMsg);
    let signedMessage;
    try {
      signedMessage = await this.provider.ethereum.request({
        method: "eth_signTypedData_v4",
        params: [this.provider.l2Address, JSON.stringify(typedMsg)],
      });
    } catch (e: any) {
      eventEmitter.emit("fail", new TransactionSignError(JSON.stringify(typedMsg), e.message));
    }

    // construct WithdrawalRequestExtra
    const withdrawalReq = {
      raw: rawWithdrawalRequest,
      signature: signedMessage,
    };
    const withdrawalReqExtra = {
      request: withdrawalReq,
      owner_lock: this.provider.getLayer1Lock(),
    };
    debug("WithdrawalRequestExtra:", withdrawalReqExtra);

    // submit WithdrawalRequestExtra
    const serializedRequest = new toolkit.Reader(WithdrawalRequestExtraCodec.pack(withdrawalReqExtra)).serializeJson();
    let txHash: string | null = null;
    try {
      txHash = await this.godwokenClient.submitWithdrawalRequest(serializedRequest);
      debug("result:", txHash);
    } catch (error) {
      const rpcError = new V1WithdrawTokenNotEnoughError(JSON.stringify(error), "Send withdrawal failed!");
      eventEmitter.emit("fail", rpcError);
    }
    if (txHash) {
      eventEmitter.emit("sent", txHash);
      debug("withdrawal request result:", txHash, eventEmitter);
      this.waitForWithdrawalToComplete(txHash, eventEmitter);
    }
  }

  generateTypedMsg(rawWithdrawalRequest: RawWithdrawalRequestV1) {
    const ownerLock = this.provider.getLayer1Lock();
    const typedMsg = {
      domain: {
        name: "Godwoken",
        version: "1",
        chainId: Number(rawWithdrawalRequest.chain_id),
      },
      message: {
        address: {
          registry: "ETH",
          address: this.provider.getL2Address(),
        },
        nonce: Number(rawWithdrawalRequest.nonce),
        chainId: Number(rawWithdrawalRequest.chain_id),
        fee: 0,
        layer1OwnerLock: {
          codeHash: ownerLock.code_hash,
          hashType: ownerLock.hash_type,
          args: ownerLock.args,
        },
        withdraw: {
          ckbCapacity: BI.from(rawWithdrawalRequest.capacity).toNumber(),
          UDTAmount: BI.from(rawWithdrawalRequest.amount).toString(),
          UDTScriptHash: rawWithdrawalRequest.sudt_script_hash,
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
          { name: "address", type: "RegistryAddress" },
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
        RegistryAddress: [
          { name: "registry", type: "string" },
          { name: "address", type: "address" },
        ],
      },
    };
    return typedMsg;
  }

  async generateRawWithdrawalRequest(
    eventEmitter: EventEmitter,
    payload: WithdrawalEventEmitterPayload,
  ): Promise<RawWithdrawalRequestV1> {
    const { layer2Config } = this.provider.getLightGodwokenConfig();
    const chainId = await this.getChainId();
    const ownerCkbAddress = payload.withdrawal_address || this.provider.l1Address;
    const ownerLock = helpers.parseAddress(ownerCkbAddress);
    const ownerLockHash = utils.computeScriptHash(ownerLock);
    const ethAddress = this.provider.l2Address;
    const l2AccountScript: Script = {
      code_hash: layer2Config.SCRIPTS.eth_account_lock.script_type_hash,
      hash_type: "type",
      args: layer2Config.ROLLUP_CONFIG.rollup_type_hash + ethAddress.slice(2),
    };
    const layer2AccountScriptHash = utils.computeScriptHash(l2AccountScript);

    // const address = layer2AccountScriptHash.slice(0, 42);
    const balance = await this.getL2CkbBalance();
    if (BI.from(balance).lt(payload.capacity)) {
      const errMsg = `Godwoken CKB balance ${BI.from(balance).toString()} is less than ${BI.from(
        payload.capacity,
      ).toString()}`;
      const error = new NotEnoughCapacityError(
        { expected: BI.from(payload.capacity), actual: BI.from(balance) },
        errMsg,
      );
      // debugProductionEnv(error);
      eventEmitter.emit("fail", error);
      throw error;
    }

    if (BI.from(payload.amount).gt(0)) {
      await this.validateSUDTAmount(payload, eventEmitter);
    }

    const fromId = await this.godwokenClient.getAccountIdByScriptHash(layer2AccountScriptHash);
    const nonce = await this.godwokenClient.getNonce(fromId!);

    const rawWithdrawalRequest = {
      nonce: BI.from(nonce).toNumber(),
      chain_id: BI.from(chainId),
      capacity: BI.from(payload.capacity),
      amount: BI.from(payload.amount),
      sudt_script_hash: payload.sudt_script_hash,
      account_script_hash: layer2AccountScriptHash,
      registry_id: 2,
      owner_lock_hash: ownerLockHash,
      fee: BI.from(0),
    };
    return rawWithdrawalRequest;
  }

  async validateSUDTAmount(payload: WithdrawalEventEmitterPayload, eventEmitter: EventEmitter) {
    const builtinErc20List = this.getBuiltinErc20List();
    const erc20 = builtinErc20List.find((e) => e.sudt_script_hash === payload.sudt_script_hash);
    if (!erc20) {
      throw new SudtNotFoundError(payload.sudt_script_hash, "SUDT not exit");
    }
    const sudtBalance = await this.getErc20Balance(erc20.address);
    if (BI.from(sudtBalance).lt(BI.from(payload.amount))) {
      const errMsg = `Godwoken ${erc20.symbol} balance ${BI.from(sudtBalance).toString()} is less than ${BI.from(
        payload.amount,
      ).toString()}`;
      const error = new NotEnoughSudtError({ expected: BI.from(payload.amount), actual: BI.from(sudtBalance) }, errMsg);
      // debugProductionEnv(error);
      eventEmitter.emit("fail", error);
      throw error;
    }
  }

  generateDepositLock(_cancelTimeout?: number): Script {
    const cancelTimeOut = _cancelTimeout || getAdvancedSettings("v1").MIN_CANCEL_DEPOSIT_TIME;
    const ownerLock: Script = helpers.parseAddress(this.provider.l1Address);
    const ownerLockHash: Hash = utils.computeScriptHash(ownerLock);
    const layer2Lock: Script = this.provider.getLayer2LockScript();

    const depositLockArgs = {
      owner_lock_hash: ownerLockHash,
      layer2_lock: layer2Lock,
      cancel_timeout: BI.from(`0xc0${BI.from(cancelTimeOut).toHexString().slice(2).padStart(14, "0")}`),
      // cancel_timeout: BI.from("0xc000000000093a80"),
      registry_id: 2,
    };
    const depositLockArgsHexString: HexString = new toolkit.Reader(
      V1DepositLockArgs.pack(depositLockArgs),
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
