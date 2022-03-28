import { helpers, Script, utils, HashType, HexNumber, Hash } from "@ckb-lumos/lumos";
import { BI } from "@ckb-lumos/bi";
import { Godwoken as GodwokenV1, WithdrawalLockArgsCodec, WithdrawalRequestExtraCodec } from "./godwoken-v1/index";
import EventEmitter from "events";
import { CkbAmount } from "@ckitjs/ckit/dist/helpers";
import { getLayer2Config } from "./constants/index";
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
import { toArrayBuffer, toHex } from "@ckb-lumos/experiment-codec/";

const { SCRIPTS, ROLLUP_CONFIG } = getLayer2Config("v1");
export default class DefaultLightGodwokenV1 extends DefaultLightGodwoken implements LightGodwokenV1 {
  getVersion(): GodwokenVersion {
    return "v1";
  }
  getBlockProduceTime(): number {
    return 30 * 1000;
  }

  async getL2CkbBalance(payload?: GetL2CkbBalancePayload): Promise<HexNumber> {
    const balance = await this.provider.web3.eth.getBalance(payload?.l2Address || this.provider.l2Address);
    console.log("get v1 l2 ckb balance", this.provider, balance);
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
    Contract.setProvider(this.provider.godwokenRpc);

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
    Contract.setProvider(this.provider.godwokenRpc);
    const contract = new Contract(ERC20.abi, address);
    const balance = contract.methods
      .balanceOf(this.provider.l2Address)
      .call({ from: this.provider.l2Address, gasPrice: "0" });
    return balance;
  }

  async listWithdraw(): Promise<WithdrawResult[]> {
    const searchParams = this.getWithdrawalCellSearchParams(this.provider.l2Address);
    console.log("searchParams is:", searchParams);
    const collectedCells: WithdrawResult[] = [];
    const collector = this.provider.ckbIndexer.collector({ lock: searchParams.script });
    const lastFinalizedBlockNumber = await this.provider.getLastFinalizedBlockNumber();

    const ownerLockHash = this.provider.getLayer1LockScriptHash();

    for await (const cell of collector.collect()) {
      console.log("iteration --> cell is:", cell);
      const rawLockArgs = cell.cell_output.lock.args;
      if (rawLockArgs === null || rawLockArgs === undefined) {
        console.warn("cell args is not valid", cell);
        continue;
      }
      const unpackedWithdrawalArgs = WithdrawalLockArgsCodec.unpack(toArrayBuffer(rawLockArgs));
      const lockArgsOwnerScriptHash = unpackedWithdrawalArgs.ownerLockHash;
      console.log("lockArgsOwnerScriptHash is:", lockArgsOwnerScriptHash);
      const withdrawBlock = unpackedWithdrawalArgs.withdrawalBlockNumber;
      console.log("withdrawBlock is:", withdrawBlock.toNumber());

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

      if (lockArgsOwnerScriptHash === ownerLockHash) {
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
    console.log("found withdraw cells:", sortedWithdrawals);
    return sortedWithdrawals;
  }

  getWithdrawalCellSearchParams(ethAddress: string) {
    if (ethAddress.length !== 42 || !ethAddress.startsWith("0x")) {
      throw new Error("eth address format error!");
    }
    return {
      script: {
        code_hash: SCRIPTS.withdrawal_lock.script_type_hash,
        hash_type: "type" as HashType,
        args: "0x",
      },
      script_type: "lock",
    };
  }

  withdrawWithEvent(payload: WithdrawalEventEmitterPayload): WithdrawalEventEmitter {
    const eventEmitter = new EventEmitter();
    this.withdraw(eventEmitter, payload);
    return eventEmitter;
  }

  async withdraw(eventEmitter: EventEmitter, payload: WithdrawalEventEmitterPayload): Promise<void> {
    eventEmitter.emit("sending");
    console.log("withdraw payload is:", payload);

    const godwokenWeb3 = new GodwokenV1(this.provider.config.GW_POLYJUICE_RPC_URL);
    const chainId = await godwokenWeb3.getChainId();
    const ownerCkbAddress = payload.withdrawal_address || this.provider.l1Address;
    const ownerLock = helpers.parseAddress(ownerCkbAddress);
    const ownerLockHash = utils.computeScriptHash(ownerLock);
    const ethAddress = this.provider.l2Address;
    const l2AccountScript: Script = {
      code_hash: SCRIPTS.eth_account_lock.script_type_hash,
      hash_type: "type",
      args: ROLLUP_CONFIG.rollup_type_hash + ethAddress.slice(2),
    };
    const layer2AccountScriptHash = utils.computeScriptHash(l2AccountScript);

    const address = layer2AccountScriptHash.slice(0, 42);
    const balance = await godwokenWeb3.getBalance(CKB_SUDT_ID, address);
    if (BI.from(balance).lt(BI.from(payload.capacity))) {
      eventEmitter.emit(
        "error",
        `Godwoken CKB balance ${CkbAmount.fromShannon(
          balance.toBigInt(),
        ).humanize()} is less than ${CkbAmount.fromShannon(payload.capacity).humanize()}`,
      );
      throw new Error(`Insufficient CKB balance(${balance}) on Godwoken`);
    }

    // const builtinErc20List = this.getBuiltinErc20List();
    // const erc20 = builtinErc20List.find((e) => e.sudt_script_hash === payload.sudt_script_hash);
    // if (!erc20) {
    //   throw new Error("SUDT not exit");
    // }
    // const sudtBalance = await this.getErc20Balance(erc20.address);
    // if (BI.from(sudtBalance).lt(BI.from(payload.amount))) {
    //   eventEmitter.emit(
    //     "error",
    //     `Godwoken ${erc20.symbol} balance ${Amount.from(balance, erc20.decimals).humanize()} is less than ${Amount.from(
    //       payload.amount,
    //       erc20.decimals,
    //     ).humanize()}`,
    //   );
    //   throw new Error(`Insufficient ${erc20.symbol} balance(${balance}) on Godwoken`);
    // }
    const fromId = await godwokenWeb3.getAccountIdByScriptHash(layer2AccountScriptHash);
    const nonce: number = await godwokenWeb3.getNonce(fromId!);

    const typedMsg = {
      domain: {
        name: "Godwoken",
        version: "1",
        chainId: Number(chainId),
      },
      message: {
        accountScriptHash: layer2AccountScriptHash,
        nonce,
        chainId: Number(chainId),
        fee: 0,
        layer1OwnerLock: {
          codeHash: ownerLock.code_hash,
          hashType: ownerLock.hash_type,
          args: ownerLock.args,
        },
        withdraw: {
          ckbCapacity: BI.from(payload.capacity).toNumber(),
          UDTAmount: BI.from(payload.amount).toString(),
          UDTScriptHash: payload.sudt_script_hash,
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
    console.log("typedMsg:", typedMsg);
    let signedMessage;
    try {
      signedMessage = await this.provider.ethereum.request({
        method: "eth_signTypedData_v4",
        params: [this.provider.l2Address, JSON.stringify(typedMsg)],
      });
    } catch (e) {
      eventEmitter.emit("error", "transaction need to be sign first");
    }

    const withdrawalReqNew = WithdrawalRequestExtraCodec.pack({
      request: {
        raw: {
          nonce: BI.from(nonce).toNumber(),
          chain_id: BI.from(chainId),
          capacity: BI.from(payload.capacity),
          amount: BI.from(payload.amount),
          sudt_script_hash: payload.sudt_script_hash,
          account_script_hash: layer2AccountScriptHash,
          owner_lock_hash: ownerLockHash,
          fee: BI.from(0),
        },
        signature: signedMessage,
      },
      owner_lock: ownerLock,
    });
    console.log("WithdrawalRequestExtra serialized new:", toHex(withdrawalReqNew));
    // submit WithdrawalRequestExtra
    const result = await godwokenWeb3.submitWithdrawalReqV1(toHex(withdrawalReqNew));
    console.log("result:", result);
    if (result !== null) {
      const errorMessage = (result as any).message;
      if (errorMessage !== undefined && errorMessage !== null) {
        eventEmitter.emit("error", errorMessage);
      }
    }
    eventEmitter.emit("sent", result);
    console.log("withdrawal request result:", result);
    const maxLoop = 100;
    let loop = 0;
    const nIntervId = setInterval(async () => {
      loop++;
      const withdrawal: any = await this.getWithdrawal(result as Hash);
      if (withdrawal && withdrawal.status === "pending") {
        console.log("withdrawal pending:", withdrawal);
        eventEmitter.emit("pending", result);
      }
      if (withdrawal && withdrawal.status === "committed") {
        console.log("withdrawal committed:", withdrawal);
        eventEmitter.emit("success", result);
        clearInterval(nIntervId);
      }
      if (withdrawal === null && loop > maxLoop) {
        eventEmitter.emit("fail", result);
        clearInterval(nIntervId);
      }
    }, 10000);
  }
}
