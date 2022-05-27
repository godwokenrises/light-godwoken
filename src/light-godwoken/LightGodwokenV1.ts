import { helpers, Script, utils, BI, HashType, HexNumber, Hash, toolkit, HexString } from "@ckb-lumos/lumos";
import EventEmitter from "events";
import { Godwoken as GodwokenV1 } from "./godwoken/godwokenV1";
import {
  WithdrawalEventEmitter,
  WithdrawalEventEmitterPayload,
  GodwokenVersion,
  LightGodwokenV1,
  ProxyERC20,
  WithdrawResult,
  SUDT,
  GetErc20Balances,
  GetErc20BalancesResult,
  GetL2CkbBalancePayload,
  Token,
} from "./lightGodwokenType";
import DefaultLightGodwoken from "./lightGodwoken";
import { getTokenList } from "./constants/tokens";
import ERC20 from "./constants/ERC20.json";
import LightGodwokenProvider from "./lightGodwokenProvider";
import { RawWithdrawalRequestV1, WithdrawalRequestExtraCodec } from "./schemas/codecV1";
import { debug, debugProductionEnv } from "./debug";
import { V1DepositLockArgs } from "./schemas/codecV1";
import {
  EthAddressFormatError,
  Layer2RpcError,
  NotEnoughCapacityError,
  NotEnoughSudtError,
  SudtNotFoundError,
  TransactionSignError,
} from "./constants/error";
export default class DefaultLightGodwokenV1 extends DefaultLightGodwoken implements LightGodwokenV1 {
  godwokenClient;
  constructor(provider: LightGodwokenProvider) {
    super(provider);
    this.godwokenClient = new GodwokenV1(provider.getLightGodwokenConfig().layer2Config.GW_POLYJUICE_RPC_URL);
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

  getBlockProduceTime(): number {
    return 30 * 1000;
  }

  getWithdrawalWaitBlock(): number {
    return 100;
  }

  async getL2CkbBalance(payload?: GetL2CkbBalancePayload): Promise<HexNumber> {
    const balance = await this.provider.web3.eth.getBalance(payload?.l2Address || this.provider.l2Address);
    // const balance = await this.godwokenClient.getCkbBalance(payload?.l2Address || this.provider.l2Address);
    debug("get v1 l2 ckb balance", this.provider, balance);
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
    getTokenList().v1.forEach((token) => {
      const tokenL1Script: Script = {
        code_hash: token.l1Lock.code_hash,
        args: token.l1Lock.args,
        hash_type: token.l1Lock.hash_type as HashType,
      };
      sudtList.push({
        type: tokenL1Script,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        tokenURI: token.tokenURI,
      });
    });
    return sudtList;
  }
  getBuiltinErc20List(): ProxyERC20[] {
    const map: ProxyERC20[] = [];
    getTokenList().v1.forEach((token) => {
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
  async getErc20Balances(payload: GetErc20Balances): Promise<GetErc20BalancesResult> {
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

  async listWithdraw(): Promise<WithdrawResult[]> {
    const searchParams = this.getWithdrawalCellSearchParams(this.provider.l2Address);
    debug("searchParams is:", searchParams);
    const collectedCells: WithdrawResult[] = [];
    const collector = this.provider.ckbIndexer.collector({ lock: searchParams.script });
    const lastFinalizedBlockNumber = await this.provider.getLastFinalizedBlockNumber();

    const ownerLockHash = this.provider.getLayer1LockScriptHash();

    for await (const cell of collector.collect()) {
      debug("iteration --> cell is:", cell);

      // // a rollup_type_hash exists before this args, to make args friendly to prefix search
      // struct WithdrawalLockArgs {
      //   withdrawal_block_hash: Byte32,
      //   withdrawal_block_number: Uint64,
      //   account_script_hash: Byte32,
      //   // layer1 lock to withdraw after challenge period
      //   owner_lock_hash: Byte32,
      // }

      // according to the args shape:
      // withdrawal_block_number byte location is 64~72
      // owner_lock_hash byte location is 104~136
      const rawLockArgs = cell.cell_output.lock.args;
      if (rawLockArgs === null || rawLockArgs === undefined) {
        console.warn("cell args is not valid", cell);
        continue;
      }
      const lockArgsOwnerScriptHash = rawLockArgs.slice(210, 274);
      debug("lockArgsOwnerScriptHash is:", lockArgsOwnerScriptHash);

      const withdrawBlock = utils.readBigUInt64LECompatible(`0x${rawLockArgs.slice(130, 146)}`);
      debug("withdrawBlock is:", withdrawBlock.toNumber());

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

      if (lockArgsOwnerScriptHash === ownerLockHash.slice(2)) {
        collectedCells.push({
          cell,
          withdrawalBlockNumber: withdrawBlock.toNumber(),
          remainingBlockNumber: Math.max(0, withdrawBlock.toNumber() - lastFinalizedBlockNumber),
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
    eventEmitter.emit("sending");
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
      eventEmitter.emit("error", new TransactionSignError(JSON.stringify(typedMsg), e.message));
    }

    // construct WithdrawalRequestExx tra
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
    const result = await this.godwokenClient.submitWithdrawalRequest(serializedRequest);
    debug("result:", result);
    if (result !== null) {
      const errorMessage = (result as any).message;
      if (errorMessage !== undefined && errorMessage !== null) {
        eventEmitter.emit("error", new Layer2RpcError(result, errorMessage));
      }
    }
    eventEmitter.emit("sent", result);
    debug("withdrawal request result:", result);
    const maxLoop = 100;
    let loop = 0;
    const nIntervId = setInterval(async () => {
      loop++;
      const withdrawal: any = await this.getWithdrawal(result as Hash);
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
      debugProductionEnv(error);
      eventEmitter.emit("error", error);
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
      debugProductionEnv(error);
      eventEmitter.emit("error", error);
      throw error;
    }
  }

  generateDepositLock(): Script {
    const ownerLock: Script = helpers.parseAddress(this.provider.l1Address);
    const ownerLockHash: Hash = utils.computeScriptHash(ownerLock);
    const layer2Lock: Script = this.provider.getLayer2LockScript();

    const depositLockArgs = {
      owner_lock_hash: ownerLockHash,
      layer2_lock: layer2Lock,
      cancel_timeout: BI.from("0xc000000000093a81"),
      registry_id: 2,
    };
    debug("depositLockArgs is: ", {
      ...depositLockArgs,
      cancel_timeout: depositLockArgs.cancel_timeout.toHexString(),
    });

    const depositLockArgsHexString: HexString = new toolkit.Reader(
      V1DepositLockArgs.pack(depositLockArgs),
    ).serializeJson();

    const { SCRIPTS, ROLLUP_CONFIG } = this.provider.getLightGodwokenConfig().layer2Config;

    const depositLock: Script = {
      code_hash: SCRIPTS.deposit_lock.script_type_hash,
      hash_type: "type",
      args: ROLLUP_CONFIG.rollup_type_hash + depositLockArgsHexString.slice(2),
    };
    debug("depositLock is: ", depositLock);
    debug("depositLock Hash is: ", utils.computeScriptHash(depositLock));
    return depositLock;
  }
}
