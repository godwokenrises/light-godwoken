import { helpers, Script, utils, BI, HashType, HexNumber, Hash } from "@ckb-lumos/lumos";
import {
  Godwoken as GodwokenV1,
  RawWithdrawalRequestV1,
  WithdrawalRequestExtra,
  WithdrawalRequestV1,
} from "./godwoken-v1/src/index";
import EventEmitter from "events";
import {
  WithdrawalEventEmitter,
  WithdrawalEventEmitterPayload,
  CKB_SUDT_ID,
  GodwokenVersion,
  LightGodwokenV1,
  ProxyERC20,
  WithdrawResult,
  SUDT,
  GetErc20Balances,
  GetErc20BalancesResult,
  GetL2CkbBalancePayload,
} from "./lightGodwokenType";
import DefaultLightGodwoken from "./lightGodwoken";
import { getTokenList } from "./constants/tokens";
import ERC20 from "./constants/ERC20.json";
import LightGodwokenProvider from "./lightGodwokenProvider";
import { debug } from "./debug";
export default class DefaultLightGodwokenV1 extends DefaultLightGodwoken implements LightGodwokenV1 {
  godwokenClient;
  constructor(provider: LightGodwokenProvider) {
    super(provider);
    this.godwokenClient = new GodwokenV1(provider.getLightGodwokenConfig().layer2Config.GW_POLYJUICE_RPC_URL);
  }
  getVersion(): GodwokenVersion {
    return "v1";
  }
  getBlockProduceTime(): number {
    return 30 * 1000;
  }

  async getL2CkbBalance(payload?: GetL2CkbBalancePayload): Promise<HexNumber> {
    const balance = await this.provider.web3.eth.getBalance(payload?.l2Address || this.provider.l2Address);
    debug("get v1 l2 ckb balance", this.provider, balance);
    return "0x" + Number(balance).toString(16);
  }

  getBuiltinSUDTList(): SUDT[] {
    const map: SUDT[] = [];
    getTokenList().v1.forEach((token) => {
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
      throw new Error("eth address format error!");
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
    debug("getWithdrawal result:", result);
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
    const typedMsg = this.generateTypedMsg(rawWithdrawalRequest);
    debug("typedMsg:", typedMsg);
    let signedMessage;
    try {
      signedMessage = await this.provider.ethereum.request({
        method: "eth_signTypedData_v4",
        params: [this.provider.l2Address, JSON.stringify(typedMsg)],
      });
    } catch (e) {
      eventEmitter.emit("error", "transaction need to be sign first");
    }

    // construct WithdrawalRequestExx tra
    const withdrawalReq: WithdrawalRequestV1 = {
      raw: rawWithdrawalRequest,
      signature: signedMessage,
    };
    const withdrawalReqExtra: WithdrawalRequestExtra = {
      request: withdrawalReq,
      owner_lock: this.provider.getLayer1Lock(),
    };
    debug("WithdrawalRequestExtra:", withdrawalReqExtra);

    // submit WithdrawalRequestExtra
    const result = await this.godwokenClient.submitWithdrawalReqV1(withdrawalReqExtra);
    debug("result:", result);
    if (result !== null) {
      const errorMessage = (result as any).message;
      if (errorMessage !== undefined && errorMessage !== null) {
        eventEmitter.emit("error", errorMessage);
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
        accountScriptHash: rawWithdrawalRequest.account_script_hash,
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
          { name: "accountScriptHash", type: "bytes32" },
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

    const address = layer2AccountScriptHash.slice(0, 42);
    const balance = await this.godwokenClient.getBalance(CKB_SUDT_ID, address);
    if (BI.from(balance).lt(payload.capacity)) {
      eventEmitter.emit(
        "error",
        `Godwoken CKB balance ${balance.toString()} is less than ${BI.from(payload.capacity).toString()}`,
      );
      throw new Error(
        `Insufficient CKB balance(${BI.from(balance).toString()}) on Godwoken, required ${BI.from(
          payload.capacity,
        ).toString()}`,
      );
    }

    if (BI.from(payload.amount).gt(0)) {
      await this.validateSUDTAmount(payload, eventEmitter);
    }

    const fromId = await this.godwokenClient.getAccountIdByScriptHash(layer2AccountScriptHash);
    const nonce: number = await this.godwokenClient.getNonce(fromId!);

    const rawWithdrawalRequest = {
      chain_id: chainId,
      nonce: BI.from(nonce).toHexString(),
      capacity: payload.capacity,
      amount: payload.amount,
      sudt_script_hash: payload.sudt_script_hash,
      account_script_hash: layer2AccountScriptHash,
      owner_lock_hash: ownerLockHash,
      fee: "0x0",
    };
    return rawWithdrawalRequest;
  }

  async validateSUDTAmount(payload: WithdrawalEventEmitterPayload, eventEmitter: EventEmitter) {
    const builtinErc20List = this.getBuiltinErc20List();
    const erc20 = builtinErc20List.find((e) => e.sudt_script_hash === payload.sudt_script_hash);
    if (!erc20) {
      throw new Error("SUDT not exit");
    }
    const sudtBalance = await this.getErc20Balance(erc20.address);
    if (BI.from(sudtBalance).lt(BI.from(payload.amount))) {
      eventEmitter.emit(
        "error",
        `Godwoken ${erc20.symbol} balance ${BI.from(sudtBalance).toString()} is less than ${BI.from(
          payload.amount,
        ).toString()}`,
      );
      throw new Error(
        `Insufficient ${erc20.symbol} balance(${BI.from(sudtBalance).toString()}) on Godwoken, Required: ${BI.from(
          payload.amount,
        ).toString()}`,
      );
    }
  }
}
