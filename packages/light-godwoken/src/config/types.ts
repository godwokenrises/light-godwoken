import { CellDep, DepType, Hash, HashType, Hexadecimal, Script } from "@ckb-lumos/lumos";
import { Config } from "@ckb-lumos/config-manager";
import { LightGodwokenToken } from "../tokens";

export enum GodwokenVersion {
  V0 = "v0",
  V1 = "v1",
}

export enum GodwokenNetwork {
  Testnet = "testnet",
  Mainnet = "mainnet",
}

export type Layer2Config = {
  SCRIPTS: {
    depositLock: {
      scriptTypeHash: Hash;
      cellDep: CellDep;
    };
    withdrawalLock: {
      scriptTypeHash: Hash;
      cellDep: CellDep;
    };
    ethAccountLock: {
      scriptTypeHash: Hash;
    };
  };
  ROLLUP_CONFIG: {
    rollupTypeHash: Hash;
    rollupTypeScript: Script;
  };
  GW_POLYJUICE_RPC_URL: string;
  SCANNER_URL: string;
  SCANNER_API: string;
  CHAIN_NAME: string;
  FINALITY_BLOCKS: number;
  BLOCK_PRODUCE_TIME: number;
  MIN_CANCEL_DEPOSIT_TIME: number;
  MULTICALL_ADDRESS?: string;
};

export type Layer1ConfigScript = {
  codeHash: Hash;
  hashType: HashType;
  txHash: Hash;
  index: Hexadecimal;
  depType: DepType;
};

export type Layer1Config = {
  SCRIPTS: {
    omniLock: Layer1ConfigScript;
    secp256k1Blake160: Layer1ConfigScript;
    sudt: Layer1ConfigScript;
  };
  CKB_INDEXER_URL: string;
  CKB_RPC_URL: string;
  SCANNER_URL: string;
};

export type LightGodwokenConfig = {
  lumosConfig: Config;
  layer1Config: Layer1Config;
  layer2Config: Layer2Config;
  tokenList: LightGodwokenToken[];
};

export type LightGodwokenConfigMap = {
  [key in GodwokenVersion]: LightGodwokenConfig;
};
