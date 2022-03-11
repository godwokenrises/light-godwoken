import {
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
  BI,
} from "@ckb-lumos/lumos";
import { core as godwokenCore } from "@polyjuice-provider/godwoken";
import {
  Godwoken as GodwokenV1,
  RawWithdrawalRequestV1,
  WithdrawalRequestExtra,
  WithdrawalRequestV1,
} from "./godwoken-v1/src/index";
import EventEmitter from "events";
import * as secp256k1 from "secp256k1";
import { ROLLUP_CONFIG, SCRIPTS } from "./constants";
import { TOKEN_LIST } from "./constants/tokens";
import {
  NormalizeDepositLockArgs,
  NormalizeRawWithdrawalRequest,
  NormalizeWithdrawalLockArgs,
  RawWithdrawalRequest,
  WithdrawalLockArgs,
  WithdrawalRequest,
} from "./godwoken/normalizer";
import LightGodwokenProvider, { POLYJUICE_CONFIG } from "./lightGodwokenProvider";
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
  LightGodwoken,
  UnlockPayload,
  WithdrawalEventEmitter,
  WithdrawalEventEmitterPayload,
  WithdrawResult,
  CKB_SUDT_ID,
} from "./lightGodwokenType";
import {
  SerializeDepositLockArgs,
  SerializeRawWithdrawalRequest,
  SerializeUnlockWithdrawalViaFinalize,
  SerializeWithdrawalLockArgs,
} from "./schemas/index.esm";

export default class DefaultLightGodwoken implements LightGodwoken {
  provider: LightGodwokenProvider;
  constructor(provider: LightGodwokenProvider) {
    this.provider = provider;
  }

  async deposit(payload: DepositPayload): Promise<string> {
    const neededCapacity = BigInt(payload.capacity);
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
        collectedSudtAmount += BigInt(utils.readBigUInt128LE(cell.data));
        collectedCells.push(cell);
        if (collectedCapatity >= neededCapacity && collectedSudtAmount >= neededSudtAmount) break;
      }
    }
    if (collectedCapatity < neededCapacity) {
      throw new Error(`Not enough CKB, expected: ${neededCapacity}, actual: ${collectedCapatity} `);
    }
    if (collectedSudtAmount < neededSudtAmount) {
      throw new Error(`Not enough SUDT, expected: ${neededSudtAmount}, actual: ${collectedSudtAmount} `);
    }

    const omniLockCellDep: CellDep = {
      out_point: {
        tx_hash: SCRIPTS.omni_lock.tx_hash,
        index: SCRIPTS.omni_lock.index,
      },
      dep_type: SCRIPTS.omni_lock.dep_type as DepType,
    };
    const secp256k1CellDep: CellDep = {
      out_point: {
        tx_hash: SCRIPTS.secp256k1_blake160.tx_hash,
        index: SCRIPTS.secp256k1_blake160.index,
      },
      dep_type: SCRIPTS.secp256k1_blake160.dep_type as DepType,
    };
    const outputCell = this.generateDepositOutputCell(collectedCells, payload);
    let txSkeleton = helpers.TransactionSkeleton({ cellProvider: this.provider.ckbIndexer });

    txSkeleton = txSkeleton
      .update("inputs", (inputs) => {
        return inputs.push(...collectedCells);
      })
      .update("outputs", (outputs) => {
        return outputs.push(...outputCell);
      })
      .update("cellDeps", (cell_deps) => {
        return cell_deps.push(omniLockCellDep);
      })
      .update("cellDeps", (cell_deps) => {
        return cell_deps.push(secp256k1CellDep);
      });

    if (payload.sudtType) {
      const sudtCellDep: CellDep = {
        out_point: {
          tx_hash: SCRIPTS.sudt.tx_hash,
          index: SCRIPTS.sudt.index,
        },
        dep_type: SCRIPTS.sudt.dep_type as DepType,
      };
      txSkeleton = txSkeleton.update("cellDeps", (cell_deps) => {
        return cell_deps.push(sudtCellDep);
      });
    }

    const signedTx = await this.provider.signL1Transaction(txSkeleton);
    const txHash = await this.provider.sendL1Transaction(signedTx);
    return txHash;
  }

  generateDepositOutputCell(collectedCells: Cell[], payload: DepositPayload): Cell[] {
    const ownerLock: Script = helpers.parseAddress(this.provider.l1Address);
    const ownerLockHash: Hash = utils.computeScriptHash(ownerLock);
    const layer2Lock: Script = {
      code_hash: SCRIPTS.eth_account_lock.script_type_hash,
      hash_type: "type",
      args: ROLLUP_CONFIG.rollup_type_hash + this.provider.l2Address.slice(2).toLowerCase(),
    };
    const depositLockArgs = {
      owner_lock_hash: ownerLockHash,
      layer2_lock: layer2Lock,
      cancel_timeout: "0xc0000000000004b0",
    };
    const depositLockArgsHexString: HexString = new toolkit.Reader(
      SerializeDepositLockArgs(NormalizeDepositLockArgs(depositLockArgs)),
    ).serializeJson();
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

  /**
   * get producing 1 block time
   */
  getBlockProduceTime(): number {
    return 45 * 1000;
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
      const sudtCapacity: bigint = helpers.minimalCellCapacity(dummySudtCell);
      const capacityLeft = BigInt(payload.cell.cell_output.capacity) - sudtCapacity;

      outputCells.push({
        cell_output: {
          capacity: `0x${capacityLeft.toString(16)}`,
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
    const omniLockCellDep: CellDep = {
      out_point: {
        tx_hash: SCRIPTS.omni_lock.tx_hash,
        index: SCRIPTS.omni_lock.index,
      },
      dep_type: SCRIPTS.omni_lock.dep_type as DepType,
    };
    const secp256k1CellDep: CellDep = {
      out_point: {
        tx_hash: SCRIPTS.secp256k1_blake160.tx_hash,
        index: SCRIPTS.secp256k1_blake160.index,
      },
      dep_type: SCRIPTS.secp256k1_blake160.dep_type as DepType,
    };
    const withdrawalLockDep: CellDep = {
      out_point: {
        tx_hash: SCRIPTS.withdrawal_lock.cell_dep.out_point.tx_hash,
        index: SCRIPTS.withdrawal_lock.cell_dep.out_point.index,
      },
      dep_type: SCRIPTS.withdrawal_lock.cell_dep.dep_type as DepType,
    };
    const rollupCellDep: CellDep = await this.provider.getRollupCellDep();
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
        return cell_deps.push(omniLockCellDep);
      })
      .update("cellDeps", (cell_deps) => {
        return cell_deps.push(secp256k1CellDep);
      })
      .update("witnesses", (witnesses) => {
        return witnesses.push(withdrawalWitness);
      });

    if (payload.cell.cell_output.type) {
      const sudtCellDep: CellDep = {
        out_point: {
          tx_hash: SCRIPTS.sudt.tx_hash,
          index: SCRIPTS.sudt.index,
        },
        dep_type: SCRIPTS.sudt.dep_type as DepType,
      };
      txSkeleton = txSkeleton.update("cellDeps", (cell_deps) => {
        return cell_deps.push(sudtCellDep);
      });
    }

    txSkeleton = await this.injectCapacity(txSkeleton, l1Lock, BigInt(0));

    const signedTx = await this.provider.signL1Transaction(txSkeleton);
    const txHash = await this.provider.sendL1Transaction(signedTx);
    return txHash;
  }

  async listWithdraw(): Promise<WithdrawResult[]> {
    const searchParams = this.getWithdrawalCellSearchParams(this.provider.l2Address);
    console.log("searchParams is:", searchParams);
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

    for await (const cell of collector.collect()) {
      const rawLockArgs = cell.cell_output.lock.args;
      const lockArgs = new godwokenCore.WithdrawalLockArgs(new toolkit.Reader(`0x${rawLockArgs.slice(66)}`));

      if (lockArgs == null) {
        continue;
      }

      const withdrawBlock = Number(lockArgs.getWithdrawalBlockNumber().toLittleEndianBigUint64());
      const containsOwnerLock = cell.cell_output.lock.args.includes(ownerLockHash.substring(2));

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
    console.log("found withdraw cells:", sortedWithdrawals);
    return sortedWithdrawals;
  }

  getWithdrawalCellSearchParams(ethAddress: string) {
    if (ethAddress.length !== 42 || !ethAddress.startsWith("0x")) {
      throw new Error("eth address format error!");
    }
    const layer2Lock: Script = {
      code_hash: SCRIPTS.eth_account_lock.script_type_hash as string,
      hash_type: "type",
      args: ROLLUP_CONFIG.rollup_type_hash + ethAddress.slice(2).toLowerCase(),
    };
    const accountScriptHash = utils.computeScriptHash(layer2Lock);

    return {
      script: {
        code_hash: SCRIPTS.withdrawal_lock.script_type_hash,
        hash_type: "type" as HashType,
        args: `${ROLLUP_CONFIG.rollup_type_hash}${accountScriptHash.slice(2)}`,
      },
      script_type: "lock",
    };
  }

  withdrawWithEvent(payload: WithdrawalEventEmitterPayload): WithdrawalEventEmitter {
    const eventEmitter = new EventEmitter();
    this.withdraw(eventEmitter, payload);
    return eventEmitter;
  }

  withdrawV1WithEvent(payload: WithdrawalEventEmitterPayload): WithdrawalEventEmitter {
    const eventEmitter = new EventEmitter();
    this.withdrawV1(eventEmitter, payload);
    return eventEmitter;
  }

  async withdrawV1(eventEmitter: EventEmitter, payload: WithdrawalEventEmitterPayload): Promise<void> {
    eventEmitter.emit("sending");
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
      throw new Error(`Insufficient balance(${balance}) on Godwoken`);
    }
    const fromId = await godwokenWeb3.getAccountIdByScriptHash(layer2AccountScriptHash);
    const nonce: number = await godwokenWeb3.getNonce(fromId!);

    const rawWithdrawalRequest: RawWithdrawalRequestV1 = {
      chain_id: chainId,
      nonce: BI.from(nonce).toHexString(),
      capacity: payload.capacity,
      amount: payload.amount,
      sudt_script_hash: payload.sudt_script_hash,
      account_script_hash: layer2AccountScriptHash,
      owner_lock_hash: ownerLockHash,
      fee: "0x0",
    };
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
          UDTAmount: BI.from(payload.amount).toNumber(),
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

    // sign message
    //  const privateKey = Buffer.from(privKey.slice(2), 'hex');
    //  const signature = signTypedData({
    //    privateKey,
    //    data: typedMsg,
    //    version: SignTypedDataVersion.V4
    //  });

    console.log("this.provider.l2Address: ", this.provider.l2Address);
    console.log("this.provider.l2Address: ", this.provider.web3.utils.isAddress(this.provider.l2Address));
    console.log("this.provider.web3!.currentProvider: ", this.provider.web3, this.provider.web3!.currentProvider);

    // (this.provider.web3!.currentProvider! as any).send({
    //   method: 'eth_signTypedData',
    //   params: [typedMsg, this.provider.l2Address],
    //   from: this.provider.l2Address,
    // }, function (err: any, result: any) {
    //   if (err) return console.error(err)
    //   if (result) {
    //     return console.error(result)
    //     // 0x4355c47d63924e8a72e509b65029052eb6c299d53a04e167c5775fd466751c9d07299936d304c153f6443dfa05f40ff007d72911b6f72307f996231605b915621c
    //   }
    // })

    let signedMessage = await this.provider.ethereum.request({
      method: "eth_signTypedData_v4",
      params: [this.provider.l2Address, JSON.stringify(typedMsg)],
    });

    // construct WithdrawalRequestExx tra
    const withdrawalReq: WithdrawalRequestV1 = {
      raw: rawWithdrawalRequest,
      signature: signedMessage,
    };
    const withdrawalReqExtra: WithdrawalRequestExtra = {
      request: withdrawalReq,
      owner_lock: ownerLock,
    };
    console.log("WithdrawalRequestExtra:", withdrawalReqExtra);

    // submit WithdrawalRequestExtra
    const result = await godwokenWeb3.submitWithdrawalReqV1(withdrawalReqExtra);
    console.log("result:", result);

    if (result !== null) {
      const errorMessage = (result as any).message;
      if (errorMessage !== undefined && errorMessage !== null) {
        throw new Error(errorMessage);
      }
    }
  }

  async withdraw(eventEmitter: EventEmitter, payload: WithdrawalEventEmitterPayload): Promise<void> {
    eventEmitter.emit("sending");
    const rollupTypeHash = ROLLUP_CONFIG.rollup_type_hash;
    const ethAccountTypeHash = SCRIPTS.eth_account_lock.script_type_hash;
    console.log(" helpers.parseAddress(payload.withdrawal_address || this.provider.l1Address)", payload, this.provider);

    const ownerLock = helpers.parseAddress(payload.withdrawal_address || this.provider.l1Address);
    const ownerLockHash = utils.computeScriptHash(ownerLock);
    const ethAddress = this.provider.l2Address;
    const l2AccountScript: Script = {
      code_hash: ethAccountTypeHash,
      hash_type: "type",
      args: rollupTypeHash + ethAddress.slice(2),
    };
    const accountScriptHash = utils.computeScriptHash(l2AccountScript);
    console.log("account script hash:", accountScriptHash);
    const fromId = await this.provider.godwokenClient.getAccountIdByScriptHash(accountScriptHash);
    if (!fromId) {
      throw new Error("account not found");
    }
    const isSudt = payload.sudt_script_hash !== "0x0000000000000000000000000000000000000000000000000000000000000000";
    const minCapacity = this.minimalWithdrawalCapacity(isSudt);
    if (BigInt(payload.capacity) < BigInt(minCapacity)) {
      throw new Error(
        `Withdrawal required ${BigInt(minCapacity)} shannons at least, provided ${BigInt(payload.capacity)}.`,
      );
    }
    const nonce: HexNumber = await this.provider.godwokenClient.getNonce(fromId);
    console.log("nonce:", nonce);
    const sellCapacity: HexNumber = "0x0";
    const sellAmount: HexNumber = "0x0";
    const paymentLockHash: HexNumber = "0x" + "00".repeat(32);
    const feeSudtId: HexNumber = "0x1";
    const feeAmount: HexNumber = "0x0";
    const rawWithdrawalRequest: RawWithdrawalRequest = {
      nonce: "0x" + BigInt(nonce).toString(16),
      capacity: "0x" + BigInt(payload.capacity).toString(16),
      amount: "0x" + BigInt(payload.amount).toString(16),
      sudt_script_hash: payload.sudt_script_hash,
      account_script_hash: accountScriptHash,
      sell_amount: sellAmount,
      sell_capacity: sellCapacity,
      owner_lock_hash: ownerLockHash,
      payment_lock_hash: paymentLockHash,
      fee: {
        sudt_id: feeSudtId,
        amount: feeAmount,
      },
    };
    console.log("rawWithdrawalRequest:", rawWithdrawalRequest);
    const message = this.generateWithdrawalMessageToSign(rawWithdrawalRequest, rollupTypeHash);
    console.log("message:", message);
    const signatureMetamaskPersonalSign: HexString = await this.signMessageMetamaskPersonalSign(message);
    console.log("signatureMetamaskPersonalSign:", signatureMetamaskPersonalSign);
    const withdrawalRequest: WithdrawalRequest = {
      raw: rawWithdrawalRequest,
      signature: signatureMetamaskPersonalSign,
    };
    console.log("withdrawalRequest:", withdrawalRequest);
    // using RPC `submitWithdrawalRequest` to submit withdrawal request to godwoken
    let result: unknown;
    try {
      result = await this.provider.godwokenClient.submitWithdrawalRequest(withdrawalRequest);
    } catch (e) {
      eventEmitter.emit("error", e);
      return;
    }
    eventEmitter.emit("sent", result);
    console.log("withdrawal request result:", result);
    const maxLoop = 100;
    let loop = 0;
    const nIntervId = setInterval(async () => {
      loop++;
      const withdrawal: any = await this.getWithdrawal(result as unknown as Hash);
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

  async getWithdrawal(txHash: Hash): Promise<unknown> {
    const result = await this.provider.godwokenClient.getWithdrawal(txHash);
    console.log("getWithdrawal result:", result);
    return result;
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

  async getL2CkbBalance(payload?: GetL2CkbBalancePayload): Promise<HexNumber> {
    const balance = await this.provider.web3.eth.getBalance(payload?.l2Address || this.provider.l2Address);
    return "0x" + Number(balance).toString(16);
  }

  async getL1CkbBalance(payload?: GetL1CkbBalancePayload): Promise<HexNumber> {
    const collector = this.provider.ckbIndexer.collector({ lock: helpers.parseAddress(this.provider.l1Address) });
    let collectedSum = BigInt(0);
    for await (const cell of collector.collect()) {
      collectedSum += BigInt(cell.cell_output.capacity);
    }
    return "0x" + collectedSum.toString(16);
  }

  getBuiltinErc20List(): ProxyERC20[] {
    const map: ProxyERC20[] = [];
    TOKEN_LIST.forEach((token) => {
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

  getBuiltinSUDTList(): SUDT[] {
    const map: SUDT[] = [];
    TOKEN_LIST.forEach((token) => {
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
      const usdcContract = new this.provider.web3.eth.Contract(POLYJUICE_CONFIG.abiItems, address);
      const usdcBalancePromise = usdcContract.methods.balanceOf(this.provider.l2Address).call();
      promises.push(usdcBalancePromise);
    }
    await Promise.all(promises).then((values) => {
      values.forEach((value) => {
        result.balances.push("0x" + Number(value).toString(16));
      });
    });
    return result;
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
        // collectedSum += BigInt(utils.readBigUInt128LE(cell.data));
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
