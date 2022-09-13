import Web3 from "web3";
import { providers } from "ethers";
import { initializeConfig } from "@ckb-lumos/config-manager";
import { utils, core, toolkit, helpers } from "@ckb-lumos/lumos";
import { Address, Indexer, RPC, Transaction, HexString, Hash, Cell, HashType, Script, BI } from "@ckb-lumos/lumos";
import { core as godwokenCore } from "@polyjuice-provider/godwoken";
import { PolyjuiceHttpProvider } from "@polyjuice-provider/web3";
import { AbiItems } from "@polyjuice-provider/base";
import { EthereumProvider } from "./ethereumProvider";
import { OmniLockWitnessLockCodec } from "./schemas/codecLayer1";
import { SUDT_ERC20_PROXY_ABI } from "./constants/sudtErc20ProxyAbi";
import { GetL1CkbBalancePayload, LightGodwokenProvider, SUDT_CELL_CAPACITY } from "./lightGodwokenType";
import { initConfigMap, validateLightGodwokenConfig } from "./config";
import { GodwokenVersion, LightGodwokenConfig, LightGodwokenConfigMap, GodwokenNetwork } from "./config";
import { EnvNotFoundError } from "./constants/error";
import { debug } from "./debug";
import { OutPoint } from "@ckb-lumos/base";

export default class DefaultLightGodwokenProvider implements LightGodwokenProvider {
  l2Address: Address;
  l1Address: Address;

  ckbIndexer; // FIXME: cannot define type for Indexer
  ckbRpc: RPC;
  web3: Web3; // TODO: check if Web3 class can be replaced by EthereumProvider
  ethereum: EthereumProvider;

  config: LightGodwokenConfig;
  configMap: LightGodwokenConfigMap;

  network: GodwokenNetwork | string;

  constructor(
    ethAddress: Address,
    ethereum: EthereumProvider,
    network: GodwokenNetwork | string,
    env: GodwokenVersion,
    configMap?: LightGodwokenConfigMap,
  ) {
    if (configMap) validateLightGodwokenConfig(configMap[env]);
    this.configMap = initConfigMap(configMap ?? network);
    this.config = this.configMap[env];

    const { layer1Config, layer2Config, lumosConfig } = this.config;
    this.ckbIndexer = new Indexer(layer1Config.CKB_INDEXER_URL, layer1Config.CKB_RPC_URL);
    this.ckbRpc = new RPC(layer1Config.CKB_RPC_URL);

    initializeConfig(lumosConfig);

    if (env === "v0") {
      const polyjuiceProvider = new PolyjuiceHttpProvider(layer2Config.GW_POLYJUICE_RPC_URL, {
        web3Url: layer2Config.GW_POLYJUICE_RPC_URL,
        abiItems: SUDT_ERC20_PROXY_ABI as AbiItems,
      });
      this.web3 = new Web3(polyjuiceProvider as any);
    } else if (env === "v1") {
      // TODO: AdaptProvider and Web3
      if (ethereum.provider instanceof providers.Web3Provider) {
        this.web3 = new Web3(ethereum.provider.provider as any);
      } else {
        this.web3 = new Web3(ethereum.provider as any);
      }
    } else {
      throw new EnvNotFoundError(env, "unsupported env");
    }

    this.network = network;
    this.ethereum = ethereum;
    this.l2Address = ethAddress;
    this.l1Address = this.generateL1Address(this.l2Address);

    // TODO: AdaptProvider and "accountsChanged" issue
    // EthereumProvider could be Web3Provider and JsonRpcProvider,
    // and "accountsChanged" only exist in Web3Provider.provider.on()
    if (EthereumProvider.isWeb3Provider(this.ethereum.provider)) {
      (this.ethereum.provider.provider as any).on("accountsChanged", (accounts: string[]) => {
        debug("eth accounts changed", accounts);
        this.l2Address = accounts[0];
        this.l1Address = this.generateL1Address(this.l2Address);
      });
    }
  }

  getConfig(): LightGodwokenConfig {
    return this.config;
  }
  getConfigMap(): LightGodwokenConfigMap {
    return this.configMap;
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
    const feeRate = await this.ckbRpc.tx_pool_info();
    return BI.from(feeRate.min_fee_rate);
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
      ckbBalance = ckbBalance.add(cell.cell_output.capacity);
    }
    const freeCkbCollector = this.ckbIndexer.collector({
      lock: helpers.parseAddress(queryAddress, {
        config: this.getConfig().lumosConfig,
      }),
      type: {
        code_hash: this.getConfig().layer1Config.SCRIPTS.sudt.code_hash,
        hash_type: this.getConfig().layer1Config.SCRIPTS.sudt.hash_type,
        args: "0x",
      },
    });
    for await (const cell of freeCkbCollector.collect()) {
      ckbBalance = ckbBalance.add(cell.cell_output.capacity).sub(SUDT_CELL_CAPACITY);
    }
    return ckbBalance;
  }

  generateL1Address(l2Address: Address): Address {
    const omniLock: Script = {
      code_hash: this.config.layer1Config.SCRIPTS.omni_lock.code_hash,
      hash_type: this.config.layer1Config.SCRIPTS.omni_lock.hash_type as HashType,
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
    return await this.ckbRpc.send_transaction(tx, "passthrough");
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
    const signedWitness = new toolkit.Reader(
      core.SerializeWitnessArgs({
        lock: OmniLockWitnessLockCodec.pack({ signature: signedMessage }).buffer,
      }),
    ).serializeJson();
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
    const rawTxHash = utils.ckbHash(
      core.SerializeRawTransaction(toolkit.normalizers.NormalizeRawTransaction(transaction)),
    );
    const serializedWitness = core.SerializeWitnessArgs({
      lock: new toolkit.Reader("0x" + "00".repeat(85)),
    });
    hasher.update(rawTxHash);
    this.hashWitness(hasher, serializedWitness);
    return hasher.digestHex();
  }

  hashWitness(hasher: utils.CKBHasher, witness: ArrayBuffer): void {
    const lengthBuffer = new ArrayBuffer(8);
    const view = new DataView(lengthBuffer);
    view.setBigUint64(0, BigInt(new toolkit.Reader(witness).length()), true);
    hasher.update(lengthBuffer);
    hasher.update(witness);
  }

  async getRollupCell(): Promise<Cell | undefined> {
    const rollupConfig = this.config.layer2Config.ROLLUP_CONFIG;
    const queryOptions = {
      type: {
        code_hash: rollupConfig.rollup_type_script.code_hash,
        hash_type: rollupConfig.rollup_type_script.hash_type,
        args: rollupConfig.rollup_type_script.args,
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
      code_hash: this.config.layer2Config.SCRIPTS.eth_account_lock.script_type_hash as string,
      hash_type: "type",
      args: this.config.layer2Config.ROLLUP_CONFIG.rollup_type_hash + this.l2Address.slice(2).toLowerCase(),
    };
  }

  getLayer2LockScriptHash(): Hash {
    const accountScriptHash = utils.computeScriptHash(this.getLayer2LockScript());
    debug("accountScriptHash", accountScriptHash);
    return accountScriptHash;
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
      code_hash: ownerCKBLock.code_hash,
      args: ownerCKBLock.args,
      hash_type: ownerCKBLock.hash_type as HashType,
    };
    const ownerLockHash = utils.computeScriptHash(ownerLock);
    debug("ownerLockHash", ownerLockHash);
    return ownerLockHash;
  }

  async getLayer1Cell(outPoint: OutPoint): Promise<Cell | null> {
    const queried = await this.ckbRpc.get_transaction(outPoint.tx_hash);
    if (!queried) return null;

    const tx = queried.transaction;
    const status = queried.tx_status;
    const block = status.block_hash ? await this.ckbRpc.get_block(status.block_hash) : null;
    const index = BI.from(outPoint.index).toNumber();
    const output = tx.outputs[index];
    return {
      cell_output: output,
      out_point: outPoint,
      data: tx.outputs_data[index],
      block_hash: status.block_hash,
      block_number: block?.header.number,
    };
  }

  async getLastFinalizedBlockNumber(): Promise<number> {
    const rollupCell = await this.getRollupCell();
    if (!rollupCell === undefined) {
      return 0;
    }
    const globalState = new godwokenCore.GlobalState(new toolkit.Reader(rollupCell!.data));
    const lastFinalizedBlockNumber = Number(globalState.getLastFinalizedBlockNumber().toLittleEndianBigUint64());
    debug("last finalized block number: ", lastFinalizedBlockNumber);
    return lastFinalizedBlockNumber;
  }

  async asyncSleep(ms = 0) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
