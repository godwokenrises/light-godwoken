import { CellDep, DepType, Hash, HashType, Hexadecimal, Script } from "@ckb-lumos/lumos";

export type Layer2Config = {
  SCRIPTS: {
    deposit_lock: {
      script_type_hash: Hash;
      cell_dep: CellDep;
    };
    withdrawal_lock: {
      script_type_hash: Hash;
      cell_dep: CellDep;
    };
    eth_account_lock: {
      script_type_hash: Hash;
    };
  };
  ROLLUP_CONFIG: {
    rollup_type_hash: Hash;
    rollup_type_script: Script;
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

export type ScriptType = {
  codeHash: Hash;
  hashType: HashType;
  txHash: Hash;
  index: Hexadecimal;
  depType: DepType;
};

export type Layer1Config = {
  SCRIPTS: {
    omni_lock: ScriptType;
    secp256k1_blake160: ScriptType;
    sudt: ScriptType;
  };
  CKB_INDEXER_URL: string;
  CKB_RPC_URL: string;
  SCANNER_URL: string;
};

export type LightGodwokenConfig = {
  layer1Config: Layer1Config;
  layer2Config: Layer2Config;
};

export type LightGodwokenConfigMap = {
  v0: LightGodwokenConfig;
  v1: LightGodwokenConfig;
};

export type GodwokenVersion = keyof LightGodwokenConfigMap;

export type LightGodwokenTokenType = {
  id: number;
  symbol: string;
  name: string;
  decimals: number;
  tokenURI: string;
  address: string;
  l1LockArgs: string;
  layer1UAN: string;
  layer2UAN: string;
  layer1DisplayName?: string;
  layer2DisplayName?: string;
};
