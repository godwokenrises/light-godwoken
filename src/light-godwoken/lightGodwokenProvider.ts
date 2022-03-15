import { getLayer2Config } from "./constants/index";
import {
  Address,
  Indexer,
  RPC,
  config,
  helpers,
  Transaction,
  HexString,
  utils,
  core,
  toolkit,
  Hash,
  Cell,
  HashType,
  Script,
  CellDep,
} from "@ckb-lumos/lumos";
import { core as godwokenCore } from "@polyjuice-provider/godwoken";
import { PROVIDER_CONFIG } from "./constants/providerConfig";
import { PolyjuiceHttpProvider } from "@polyjuice-provider/web3";
import { SUDT_ERC20_PROXY_ABI } from "./constants/sudtErc20ProxyAbi";
import { AbiItems, PolyjuiceConfig } from "@polyjuice-provider/base";
import { GodwokenClient } from "./godwoken/godwoken";
import Web3 from "web3";
import { LightGodwokenProvider } from "./lightGodwokenType";
import { WithdrawalRequest } from "./godwoken/normalizer";
import { SerializeRcLockWitnessLock } from "./omni-lock/index";
import { TransactionWithStatus } from "@ckb-lumos/base";
import { LAYER1_CONFIG } from "./constants/layer1ConfigUtils";

const { SCRIPTS, ROLLUP_CONFIG } = getLayer2Config();

export const POLYJUICE_CONFIG = {
  web3Url: PROVIDER_CONFIG.GODWOKEN_V1.GW_POLYJUICE_RPC_URL,
  abiItems: SUDT_ERC20_PROXY_ABI as AbiItems,
};

export const polyjuiceProvider = new PolyjuiceHttpProvider(
  POLYJUICE_CONFIG.web3Url,
  POLYJUICE_CONFIG as PolyjuiceConfig,
);

export default class DefaultLightGodwokenProvider implements LightGodwokenProvider {
  l2Address: Address = "";
  l1Address: Address = "";
  ckbIndexer;
  rpc;
  ethereum;
  web3;
  godwokenClient;
  config;

  constructor(ethAddress: Address, ethereum: any, env = "GODWOKEN_V1") {
    if (env === "AGGRON" || env === "GODWOKEN_V1") {
      config.initializeConfig(config.predefined.AGGRON4);
    } else if (env === "LINA") {
      config.initializeConfig(config.predefined.LINA);
    } else {
      throw new Error("env not defined, please use AGGRON or LINA.");
    }
    const configObj = PROVIDER_CONFIG[`${env}`];
    console.log("configObj", configObj);

    this.config = configObj;
    this.ckbIndexer = new Indexer(configObj.CKB_INDEXER_URL, configObj.CKB_RPC_URL);
    this.rpc = new RPC(configObj.CKB_RPC_URL);
    this.godwokenClient = new GodwokenClient(configObj.GW_POLYJUICE_RPC_URL);

    this.ethereum = ethereum;
    this.l2Address = ethAddress;
    this.l1Address = this.generateL1Address(this.l2Address);
    ethereum.on("accountsChanged", (accounts: any) => {
      console.log("eth accounts changed", accounts);
      this.l2Address = accounts[0];
      this.l1Address = this.generateL1Address(this.l2Address);
    });

    this.web3 = new Web3(polyjuiceProvider);
  }

  async sendWithdrawTransaction(withdrawalRequest: WithdrawalRequest): Promise<string> {
    const result = await this.godwokenClient.submitWithdrawalRequest(withdrawalRequest);
    return result as unknown as string;
  }

  getL2Address(): string {
    return this.l2Address;
  }
  getL1Address(): string {
    return this.l1Address;
  }

  static async CreateProvider(ethereum: any): Promise<LightGodwokenProvider> {
    if (!ethereum || !ethereum.isMetaMask) {
      throw new Error("please provide metamask ethereum object");
    }
    return ethereum
      .request({ method: "eth_requestAccounts" })
      .then((accounts: any) => {
        console.log("eth_requestAccounts", accounts);
        return new DefaultLightGodwokenProvider(accounts[0], ethereum);
      })
      .catch((error: any) => {
        if (error.code === 4001) {
          // EIP-1193 userRejectedRequest error
          console.log("Please connect to MetaMask.");
        } else {
          console.error(error);
        }
      });
  }

  generateL1Address(l2Address: Address): Address {
    const omniLock: Script = {
      code_hash: LAYER1_CONFIG.omni_lock.code_hash,
      hash_type: LAYER1_CONFIG.omni_lock.hash_type as HashType,
      // omni flag       pubkey hash   omni lock flags
      // chain identity   eth addr      function flag()
      // 00: Nervos       👇            00: owner
      // 01: Ethereum     👇            01: administrator
      //      👇          👇            👇
      args: `0x01${l2Address.substring(2)}00`,
    };
    return helpers.generateAddress(omniLock);
  }

  // // TODO the unknown is godwoken submit_withdrawal_tx
  // sendWithdrawTransaction: (tx: unknown) => Promise<Hash>;

  // // now only supported omni lock, the other lock type will be supported later
  async sendL1Transaction(tx: Transaction): Promise<Hash> {
    return await this.rpc.send_transaction(tx, "passthrough");
  }

  async signL1Transaction(txSkeleton: helpers.TransactionSkeletonType): Promise<Transaction> {
    const message = this.generateMessage(txSkeleton);
    let signedMessage = await this.ethereum.request({
      method: "personal_sign",
      params: [this.ethereum.selectedAddress, message],
    });
    let v = Number.parseInt(signedMessage.slice(-2), 16);
    if (v >= 27) v -= 27;
    signedMessage = "0x" + signedMessage.slice(2, -2) + v.toString(16).padStart(2, "0");
    const signedWitness = new toolkit.Reader(
      core.SerializeWitnessArgs({
        lock: SerializeRcLockWitnessLock({
          signature: new toolkit.Reader(signedMessage),
        }),
      }),
    ).serializeJson();
    txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.push(`${signedWitness}`));
    const signedTx = helpers.createTransactionFromSkeleton(txSkeleton);
    return signedTx;
  }

  generateMessage(tx: helpers.TransactionSkeletonType): HexString {
    const hasher = new utils.CKBHasher();
    const rawTxHash = utils.ckbHash(
      core.SerializeRawTransaction(
        toolkit.normalizers.NormalizeRawTransaction(helpers.createTransactionFromSkeleton(tx)),
      ),
    );
    const serializedWitness = core.SerializeWitnessArgs({
      lock: new toolkit.Reader(
        "0x" +
          "00".repeat(
            SerializeRcLockWitnessLock({
              signature: new toolkit.Reader("0x" + "00".repeat(65)),
            }).byteLength,
          ),
      ),
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

  async getPendingTransaction(txHash: Hash): Promise<TransactionWithStatus | null> {
    let tx: TransactionWithStatus | null = null;

    // retry 10 times, and sleep 1s
    for (let i = 0; i < 10; i++) {
      tx = await this.rpc.get_transaction(txHash);
      if (tx != null) {
        return tx;
      }
      await this.asyncSleep(1000);
    }
    return null;
  }

  async getRollupCellDep(): Promise<CellDep> {
    const result = await this.godwokenClient.getLastSubmittedInfo();
    const txHash = result.transaction_hash;
    const tx = await this.getPendingTransaction(txHash);

    if (tx == null) {
      throw new Error("Last submitted tx not found!");
    }

    let rollupIndex = tx.transaction.outputs.findIndex((o: any) => {
      return o.type && utils.computeScriptHash(o.type) === ROLLUP_CONFIG.rollup_type_hash;
    });
    return {
      out_point: {
        tx_hash: txHash,
        index: `0x${rollupIndex.toString(16)}`,
      },
      dep_type: "code",
    };
  }

  async getRollupCell(): Promise<Cell | undefined> {
    const queryOptions = {
      type: {
        code_hash: ROLLUP_CONFIG.rollup_type_script.code_hash as Hash,
        hash_type: ROLLUP_CONFIG.rollup_type_script.hash_type as HashType,
        args: ROLLUP_CONFIG.rollup_type_script.args as HexString,
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
      code_hash: SCRIPTS.eth_account_lock.script_type_hash as string,
      hash_type: "type",
      args: ROLLUP_CONFIG.rollup_type_hash + this.l2Address.slice(2).toLowerCase(),
    };
    return layer2Lock;
  }

  getLayer2LockScriptHash(): Hash {
    const accountScriptHash = utils.computeScriptHash(this.getLayer2LockScript());
    console.log("accountScriptHash", accountScriptHash);
    return accountScriptHash;
  }

  getLayer1LockScriptHash(): Hash {
    const ownerCKBLock = helpers.parseAddress(this.l1Address);
    const ownerLock: Script = {
      code_hash: ownerCKBLock.code_hash,
      args: ownerCKBLock.args,
      hash_type: ownerCKBLock.hash_type as HashType,
    };
    const ownerLockHash = utils.computeScriptHash(ownerLock);
    console.log("ownerLockHash", ownerLockHash);
    return ownerLockHash;
  }

  async getLastFinalizedBlockNumber(): Promise<number> {
    const rollupCell = await this.getRollupCell();
    if (!rollupCell === undefined) {
      return 0;
    }
    const globalState = new godwokenCore.GlobalState(new toolkit.Reader(rollupCell!.data));
    const lastFinalizedBlockNumber = Number(globalState.getLastFinalizedBlockNumber().toLittleEndianBigUint64());
    console.log("last finalized block number: ", lastFinalizedBlockNumber);
    return lastFinalizedBlockNumber;
  }

  async asyncSleep(ms = 0) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
