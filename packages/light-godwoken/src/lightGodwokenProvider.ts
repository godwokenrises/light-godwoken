import {
  Address,
  Indexer,
  RPC,
  helpers,
  Transaction,
  HexString,
  utils,
  toolkit,
  Hash,
  Cell,
  HashType,
  Script,
  BI,
} from "@ckb-lumos/lumos";
import { core as godwokenCore } from "@polyjuice-provider/godwoken";
import { PolyjuiceHttpProvider } from "@polyjuice-provider/web3";
import { SUDT_ERC20_PROXY_ABI } from "./constants/sudtErc20ProxyAbi";
import { AbiItems } from "@polyjuice-provider/base";
import Web3 from "web3";
import { GetL1CkbBalancePayload, LightGodwokenProvider, SUDT_CELL_CAPACITY } from "./lightGodwokenType";
import { debug } from "./debug";
import { claimUSDC } from "./sudtFaucet";
import { GodwokenVersion, LightGodwokenConfig, LightGodwokenConfigMap } from "./constants/configTypes";
import { EnvNotFoundError, EthereumNotFoundError, LightGodwokenConfigNotValidError } from "./constants/error";
import { OmniLockWitnessLockCodec } from "./schemas/codecLayer1";
import { isSpecialWallet } from "./utils";
import { initConfig } from "./constants/configManager";
import { blockchain } from "@ckb-lumos/base";
import { bytes } from "@ckb-lumos/codec";

export default class DefaultLightGodwokenProvider implements LightGodwokenProvider {
  l2Address: Address = "";
  l1Address: Address = "";
  ckbIndexer;
  ckbRpc;
  ethereum;
  web3;
  lightGodwokenConfig;
  constructor(ethAddress: Address, ethereum: any, env: GodwokenVersion, lightGodwokenConfig?: LightGodwokenConfigMap) {
    if (lightGodwokenConfig) {
      validateLightGodwokenConfig(lightGodwokenConfig[env]);
    }
    this.lightGodwokenConfig = initConfig(env, lightGodwokenConfig);

    const { layer1Config, layer2Config } = this.lightGodwokenConfig;
    this.ckbIndexer = new Indexer(layer1Config.CKB_INDEXER_URL, layer1Config.CKB_RPC_URL);
    this.ckbRpc = new RPC(layer1Config.CKB_RPC_URL);

    if (env === "v0") {
      const polyjuiceProvider = new PolyjuiceHttpProvider(layer2Config.GW_POLYJUICE_RPC_URL, {
        web3Url: layer2Config.GW_POLYJUICE_RPC_URL,
        abiItems: SUDT_ERC20_PROXY_ABI as AbiItems,
      });
      this.web3 = new Web3(polyjuiceProvider as any);
    } else if (env === "v1") {
      this.web3 = new Web3(ethereum || (window.ethereum as any));
    } else {
      throw new EnvNotFoundError(env, "unsupported env");
    }

    this.ethereum = ethereum;
    this.l2Address = ethAddress;
    this.l1Address = this.generateL1Address(this.l2Address);
    ethereum.on("accountsChanged", (accounts: any) => {
      debug("eth accounts changed", accounts);
      this.l2Address = accounts[0];
      this.l1Address = this.generateL1Address(this.l2Address);
    });
  }

  getConfig(): LightGodwokenConfig {
    return this.lightGodwokenConfig;
  }

  async claimUSDC(): Promise<HexString> {
    return claimUSDC(this.ethereum, this.getLightGodwokenConfig(), this.getL2Address(), this.ckbRpc, this.ckbIndexer);
  }

  async getMinFeeRate(): Promise<BI> {
    const feeRate = await this.ckbRpc.txPoolInfo();
    return BI.from(feeRate.minFeeRate);
  }

  getL2Address(): string {
    return this.l2Address;
  }
  getL1Address(): string {
    return this.l1Address;
  }

  async getL1CkbBalance(payload?: GetL1CkbBalancePayload): Promise<BI> {
    const queryAddress = !!payload && !!payload.l1Address ? payload.l1Address : this.l1Address;
    let ckbBalance = BI.from(0);
    const pureCkbCollector = this.ckbIndexer.collector({
      lock: helpers.parseAddress(queryAddress),
      type: "empty",
      outputDataLenRange: ["0x0", "0x1"],
    });
    for await (const cell of pureCkbCollector.collect()) {
      ckbBalance = ckbBalance.add(cell.cellOutput.capacity);
    }
    const freeCkbCollector = this.ckbIndexer.collector({
      lock: helpers.parseAddress(queryAddress),
      type: {
        codeHash: this.getConfig().layer1Config.SCRIPTS.sudt.codeHash,
        hashType: this.getConfig().layer1Config.SCRIPTS.sudt.hashType,
        args: "0x",
      },
    });
    for await (const cell of freeCkbCollector.collect()) {
      ckbBalance = ckbBalance.add(cell.cellOutput.capacity).sub(SUDT_CELL_CAPACITY);
    }
    return ckbBalance;
  }

  getLightGodwokenConfig(): LightGodwokenConfig {
    return this.lightGodwokenConfig;
  }

  static async CreateProvider(ethereum: any, version: GodwokenVersion): Promise<LightGodwokenProvider> {
    if (!ethereum || !ethereum.isMetaMask) {
      throw new EthereumNotFoundError(ethereum, "please provide metamask ethereum object");
    }
    return ethereum
      .request({ method: "eth_requestAccounts" })
      .then((accounts: any) => {
        debug("eth_requestAccounts", accounts);
        return new DefaultLightGodwokenProvider(accounts[0], ethereum, version);
      })
      .catch((error: any) => {
        if (error.code === 4001) {
          // EIP-1193 userRejectedRequest error
          debug("Please connect to MetaMask.");
        } else {
          console.error(error);
        }
      });
  }

  generateL1Address(l2Address: Address): Address {
    const omniLock: Script = {
      codeHash: this.lightGodwokenConfig.layer1Config.SCRIPTS.omni_lock.codeHash,
      hashType: this.lightGodwokenConfig.layer1Config.SCRIPTS.omni_lock.hashType as HashType,
      // omni flag       pubkey hash   omni lock flags
      // chain identity   eth addr      function flag()
      // 00: Nervos       👇            00: owner
      // 01: Ethereum     👇            01: administrator
      //      👇          👇            👇
      args: `0x01${l2Address.substring(2)}00`,
    };
    return helpers.generateAddress(omniLock);
  }

  // // now only supported omni lock, the other lock type will be supported later
  async sendL1Transaction(tx: Transaction): Promise<Hash> {
    return await this.ckbRpc.sendTransaction(tx, "passthrough");
  }

  async signMessage(message: string, dummySign = false): Promise<string> {
    debug("message before sign", message);
    let signedMessage = `0x${"00".repeat(65)}`;

    if (!dummySign) {
      signedMessage = await this.ethereum.request({
        method: "personal_sign",
        params: isSpecialWallet() ? [message] : [this.ethereum.selectedAddress, message],
      });
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
    const signedTx = helpers.createTransactionFromSkeleton(txSkeleton);
    return signedTx;
  }

  generateMessageByTxSkeleton(tx: helpers.TransactionSkeletonType): HexString {
    const transaction = helpers.createTransactionFromSkeleton(tx);
    return this.generateMessageByTransaction(transaction);
  }

  generateMessageByTransaction(transaction: Transaction): HexString {
    const hasher = new utils.CKBHasher();
    const rawTxHash = utils.ckbHash(blockchain.RawTransaction.pack(transaction));
    const serializedWitness = blockchain.WitnessArgs.pack({ lock: new Uint8Array(85) });
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
    const rollupConfig = this.lightGodwokenConfig.layer2Config.ROLLUP_CONFIG;
    const queryOptions = {
      type: {
        codeHash: rollupConfig.rollup_type_script.codeHash,
        hashType: rollupConfig.rollup_type_script.hashType,
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
    const layer2Lock: Script = {
      codeHash: this.lightGodwokenConfig.layer2Config.SCRIPTS.eth_account_lock.scriptType_hash as string,
      hashType: "type",
      args:
        this.lightGodwokenConfig.layer2Config.ROLLUP_CONFIG.rollup_type_hash + this.l2Address.slice(2).toLowerCase(),
    };
    return layer2Lock;
  }

  getLayer2LockScriptHash(): Hash {
    const accountScriptHash = utils.computeScriptHash(this.getLayer2LockScript());
    debug("accountScriptHash", accountScriptHash);
    return accountScriptHash;
  }

  getLayer1Lock(): Script {
    return helpers.parseAddress(this.l1Address);
  }

  getLayer1LockScriptHash(): Hash {
    const ownerCKBLock = helpers.parseAddress(this.l1Address);
    const ownerLock: Script = {
      codeHash: ownerCKBLock.codeHash,
      args: ownerCKBLock.args,
      hashType: ownerCKBLock.hashType as HashType,
    };
    const ownerLockHash = utils.computeScriptHash(ownerLock);
    debug("ownerLockHash", ownerLockHash);
    return ownerLockHash;
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
function validateLightGodwokenConfig(
  lightGodwokenConfig: LightGodwokenConfig,
): asserts lightGodwokenConfig is LightGodwokenConfig {
  if (
    !lightGodwokenConfig ||
    !lightGodwokenConfig.layer2Config ||
    !lightGodwokenConfig.layer2Config.SCRIPTS ||
    !lightGodwokenConfig.layer2Config.ROLLUP_CONFIG ||
    !lightGodwokenConfig.layer2Config.GW_POLYJUICE_RPC_URL ||
    !lightGodwokenConfig.layer1Config ||
    !lightGodwokenConfig.layer1Config.SCRIPTS ||
    !lightGodwokenConfig.layer1Config.CKB_INDEXER_URL ||
    !lightGodwokenConfig.layer1Config.CKB_RPC_URL
  ) {
    throw new LightGodwokenConfigNotValidError(JSON.stringify(lightGodwokenConfig), "lightGodwokenConfig not valid.");
  }
}
