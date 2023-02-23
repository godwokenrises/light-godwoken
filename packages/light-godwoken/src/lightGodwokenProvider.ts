import Web3 from "web3";
import { providers } from "ethers";
import { number, bytes } from "@ckb-lumos/codec";
import { utils, helpers } from "@ckb-lumos/lumos";
import { initializeConfig } from "@ckb-lumos/config-manager";
import { blockchain, OutPoint, TransactionWithStatus } from "@ckb-lumos/base";
import { Address, Indexer, RPC, Transaction, HexString, Hash, Cell, HashType, Script, BI } from "@ckb-lumos/lumos";
import { core as godwokenCore } from "@polyjuice-provider/godwoken";
import { PolyjuiceHttpProvider } from "@polyjuice-provider/web3";
import { AbiItems } from "@polyjuice-provider/base";
import { EthereumProvider } from "./ethereumProvider";
import { OmniLockWitnessLockCodec } from "./schemas/codecLayer1";
import { SUDT_ERC20_PROXY_ABI } from "./constants/sudtErc20ProxyAbi";
import { GetL1CkbBalancePayload, LightGodwokenProvider, SUDT_CELL_CAPACITY } from "./lightGodwokenType";
import { initConfig, validateLightGodwokenConfig } from "./config";
import { GodwokenVersion, LightGodwokenConfig, GodwokenNetwork } from "./config";
import {
  EnvNotFoundError,
  L1TransactionNotExistError,
  L1TransactionRejectedError,
  L1TransactionTimeoutError,
} from "./constants/error";
import { debug } from "./debug";
import { retryIfFailed } from "./utils/async";
import TransactionManager from "@ckb-lumos/transaction-manager";

export default class DefaultLightGodwokenProvider implements LightGodwokenProvider {
  l2Address: Address;
  l1Address: Address;

  ckbIndexer; // FIXME: cannot define type for Indexer
  ckbRpc: RPC;
  web3: Web3; // TODO: check if Web3 class can be replaced by EthereumProvider
  ethereum: EthereumProvider;

  config: LightGodwokenConfig;
  network: GodwokenNetwork | string;
  transactionManager: TransactionManager;

  constructor(params: {
    ethAddress: Address;
    ethereum: EthereumProvider;
    network: GodwokenNetwork | string;
    version: GodwokenVersion;
    config?: LightGodwokenConfig;
  }) {
    const { ethAddress, ethereum, network, version, config } = params;

    if (config) validateLightGodwokenConfig(config);
    this.config = initConfig(config ?? network, version);

    const { layer1Config, layer2Config, lumosConfig } = this.config;
    this.ckbIndexer = new Indexer(layer1Config.CKB_INDEXER_URL, layer1Config.CKB_RPC_URL);
    this.ckbRpc = new RPC(layer1Config.CKB_RPC_URL);
    this.transactionManage = new TransactionManager(this.ckbIndexer);

    initializeConfig(lumosConfig);

    if (version === "v0") {
      const polyjuiceProvider = new PolyjuiceHttpProvider(layer2Config.GW_POLYJUICE_RPC_URL, {
        web3Url: layer2Config.GW_POLYJUICE_RPC_URL,
        abiItems: SUDT_ERC20_PROXY_ABI as AbiItems,
      });
      this.web3 = new Web3(polyjuiceProvider as any);
    } else if (version === "v1") {
      // TODO: AdaptProvider and Web3
      if (ethereum.provider instanceof providers.Web3Provider) {
        this.web3 = new Web3(ethereum.provider.provider as any);
      } else {
        this.web3 = new Web3(ethereum.provider as any);
      }
    } else {
      throw new EnvNotFoundError(version, "unsupported env");
    }

    this.network = network;
    this.ethereum = ethereum;
    this.l2Address = ethAddress;
    this.l1Address = this.generateL1Address(this.l2Address);

    // FIXME: AdaptProvider and "accountsChanged" issue
    // EthereumProvider could be Web3Provider and JsonRpcProvider,
    // and "accountsChanged" only exist in Web3Provider.provider.on()
    // ---
    // Also, the following codes cannot handle empty account list (accounts = [])
    /*if (EthereumProvider.isWeb3Provider(this.ethereum.provider)) {
      (this.ethereum.provider.provider as any).on("accountsChanged", (accounts: string[]) => {
        debug("eth accounts changed", accounts);
        this.l2Address = accounts[0];
        this.l1Address = this.generateL1Address(this.l2Address);
      });
    }*/
  }

  getConfig(): LightGodwokenConfig {
    return this.config;
  }
  getNetwork(): GodwokenNetwork | string {
    return this.network;
  }
  getL2Address(): string {
    return this.l2Address;
  }
  getL1Address(): string {
    return this.l1Address;
  }

  async getMinFeeRate(): Promise<BI> {
    const feeRate = await this.ckbRpc.txPoolInfo();
    return BI.from(feeRate.minFeeRate);
  }

  async getL1CkbBalance(payload?: GetL1CkbBalancePayload): Promise<BI> {
    const queryAddress = !!payload && !!payload.l1Address ? payload.l1Address : this.l1Address;
    let ckbBalance = BI.from(0);
    const pureCkbCollector = this.ckbIndexer.collector({
      lock: helpers.parseAddress(queryAddress, {
        config: this.getConfig().lumosConfig,
      }),
      type: "empty",
      outputDataLenRange: ["0x0", "0x1"],
    });
    for await (const cell of pureCkbCollector.collect()) {
      ckbBalance = ckbBalance.add(cell.cellOutput.capacity);
    }
    const freeCkbCollector = this.ckbIndexer.collector({
      lock: helpers.parseAddress(queryAddress, {
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
      ckbBalance = ckbBalance.add(cell.cellOutput.capacity).sub(SUDT_CELL_CAPACITY);
    }
    return ckbBalance;
  }

  generateL1Address(l2Address: Address): Address {
    const omniLock: Script = {
      codeHash: this.config.layer1Config.SCRIPTS.omniLock.codeHash,
      hashType: this.config.layer1Config.SCRIPTS.omniLock.hashType as HashType,
      // omni flag       pubkey hash   omni lock flags
      // chain identity   eth addr      function flag()
      // 00: Nervos       👇            00: owner
      // 01: Ethereum     👇            01: administrator
      //      👇          👇            👇
      args: `0x01${l2Address.substring(2)}00`,
    };

    return helpers.encodeToAddress(omniLock, {
      config: this.getConfig().lumosConfig,
    });
  }

  // // now only supported omni lock, the other lock type will be supported later
  async sendL1Transaction(tx: Transaction): Promise<Hash> {
    return await this.transactionManage.sendTransaction(tx);
  }

  async signMessage(message: string, dummySign = false): Promise<string> {
    debug("message before sign", message);
    let signedMessage = `0x${"00".repeat(65)}`;

    if (!dummySign) {
      signedMessage = await this.ethereum.signMessage(message);
    }

    let v = Number.parseInt(signedMessage.slice(-2), 16);
    if (v >= 27) v -= 27;
    signedMessage = "0x" + signedMessage.slice(2, -2) + v.toString(16).padStart(2, "0");
    debug("message after sign", signedMessage);
    const signedWitness = bytes.hexify(
      blockchain.WitnessArgs.pack({
        lock: OmniLockWitnessLockCodec.pack({ signature: signedMessage }).buffer,
      }),
    );
    debug("signedWitness", signedWitness);
    return signedWitness;
  }

  async signL1Tx(tx: Transaction, dummySign = false): Promise<Transaction> {
    const message = this.generateMessageByTransaction(tx);
    const signedWitness = await this.signMessage(message, dummySign);
    tx.witnesses.push(signedWitness);
    return tx;
  }

  async signL1TxSkeleton(txSkeleton: helpers.TransactionSkeletonType, dummySign = false): Promise<Transaction> {
    const message = this.generateMessageByTxSkeleton(txSkeleton);
    const signedWitness = await this.signMessage(message, dummySign);
    txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.push(signedWitness));
    return helpers.createTransactionFromSkeleton(txSkeleton);
  }

  generateMessageByTxSkeleton(tx: helpers.TransactionSkeletonType): HexString {
    const transaction = helpers.createTransactionFromSkeleton(tx);
    return this.generateMessageByTransaction(transaction);
  }

  generateMessageByTransaction(transaction: Transaction): HexString {
    const hasher = new utils.CKBHasher();
    const rawTxHash = utils.ckbHash(blockchain.RawTransaction.pack(transaction).buffer);
    const serializedWitness = blockchain.WitnessArgs.pack({
      lock: bytes.bytify("0x" + "00".repeat(85)),
    });
    hasher.update(rawTxHash);
    this.hashWitness(hasher, serializedWitness);
    return hasher.digestHex();
  }

  hashWitness(hasher: utils.CKBHasher, witness: ArrayBuffer): void {
    const packedLength = number.Uint64LE.pack(witness.byteLength);
    hasher.update(packedLength.buffer);
    hasher.update(witness);
  }

  async getRollupCell(): Promise<Cell | undefined> {
    const rollupConfig = this.config.layer2Config.ROLLUP_CONFIG;
    const queryOptions = {
      type: {
        codeHash: rollupConfig.rollupTypeScript.codeHash,
        hashType: rollupConfig.rollupTypeScript.hashType,
        args: rollupConfig.rollupTypeScript.args,
      },
    };
    const collector = this.ckbIndexer.collector(queryOptions);
    let rollupCell;
    for await (const cell of collector.collect()) {
      if (cell === null) {
        return undefined;
      } else {
        rollupCell = cell;
        break;
      }
    }
    return rollupCell;
  }

  getLayer2LockScript(): Script {
    return {
      codeHash: this.config.layer2Config.SCRIPTS.ethAccountLock.scriptTypeHash as string,
      hashType: "type",
      args: this.config.layer2Config.ROLLUP_CONFIG.rollupTypeHash + this.l2Address.slice(2).toLowerCase(),
    };
  }

  getLayer2LockScriptHash(): Hash {
    return utils.computeScriptHash(this.getLayer2LockScript());
  }

  getLayer1Lock(): Script {
    return helpers.parseAddress(this.l1Address, {
      config: this.getConfig().lumosConfig,
    });
  }

  getLayer1LockScriptHash(): Hash {
    const ownerCKBLock = helpers.parseAddress(this.l1Address, {
      config: this.getConfig().lumosConfig,
    });
    const ownerLock: Script = {
      codeHash: ownerCKBLock.codeHash,
      args: ownerCKBLock.args,
      hashType: ownerCKBLock.hashType as HashType,
    };
    return utils.computeScriptHash(ownerLock);
  }

  async getLayer1Cell(outPoint: OutPoint): Promise<Cell | null> {
    const queried = await this.ckbRpc.getTransaction(outPoint.txHash);
    if (!queried) return null;

    const tx = queried.transaction;
    const status = queried.txStatus;
    const block = status.blockHash ? await this.ckbRpc.getBlock(status.blockHash) : null;
    const index = BI.from(outPoint.index).toNumber();
    const output = tx.outputs[index];
    return {
      cellOutput: output,
      outPoint: outPoint,
      data: tx.outputsData[index],
      blockHash: status.blockHash,
      blockNumber: block?.header.number,
    };
  }

  async getLastFinalizedBlockNumber(): Promise<number> {
    const rollupCell = await this.getRollupCell();
    if (!rollupCell === undefined) {
      return 0;
    }
    const globalState = new godwokenCore.GlobalState(bytes.bytify(rollupCell!.data).buffer);
    const lastFinalizedBlockNumber = Number(globalState.getLastFinalizedBlockNumber().toLittleEndianBigUint64());
    debug("last finalized block number: ", lastFinalizedBlockNumber);
    return lastFinalizedBlockNumber;
  }

  async asyncSleep(ms = 0) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async waitForL1Transaction(txHash: Hash): Promise<TransactionWithStatus> {
    const tx = await retryIfFailed(
      async () => {
        const txWithStatus = await this.ckbRpc.getTransaction(txHash);
        debug("waitForL1Transaction", txHash, txWithStatus);
        if (!txWithStatus) {
          throw new L1TransactionNotExistError(txHash, "L1 Tx not exist");
        }
        if (["committed", "rejected"].includes(txWithStatus.txStatus.status)) {
          return txWithStatus;
        } else {
          throw new L1TransactionTimeoutError(txHash, "L1 tx timeout");
        }
      },
      60,
      1000,
    );

    if (tx.txStatus.status === "rejected") {
      throw new L1TransactionRejectedError(txHash, "L1 tx rejected");
    }

    return tx;
  }
}
