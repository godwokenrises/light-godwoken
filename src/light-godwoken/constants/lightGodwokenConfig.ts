import { CellDep, DepType, Hash, HashType, Hexadecimal, Script } from "@ckb-lumos/lumos";
import { GodwokenVersion } from "../lightGodwokenType";

export type Layer2Config = {
  SCRIPTS: {
    deposit_lock: {
      script_type_hash: Hash;
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
};
export type ScriptType = {
  code_hash: Hash;
  hash_type: HashType;
  tx_hash: Hash;
  index: Hexadecimal;
  dep_type: DepType;
};
export type Layer1Config = {
  SCRIPTS: {
    omni_lock: ScriptType;
    secp256k1_blake160: ScriptType;
    sudt: ScriptType;
  };
  CKB_INDEXER_URL: string;
  CKB_RPC_URL: string;
};
export type LightGodwokenConfig = {
  layer1Config: Layer1Config;
  layer2Config: Layer2Config;
};
const layer1ConfigAggron: Layer1Config = {
  SCRIPTS: {
    omni_lock: {
      code_hash: "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
      hash_type: "type",
      tx_hash: "0x9154df4f7336402114d04495175b37390ce86a4906d2d4001cf02c3e6d97f39c",
      index: "0x0",
      dep_type: "code",
    },
    secp256k1_blake160: {
      code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
      tx_hash: "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
      index: "0x0",
      dep_type: "dep_group",
    },
    sudt: {
      code_hash: "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
      hash_type: "type",
      tx_hash: "0xe12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769",
      index: "0x0",
      dep_type: "code",
    },
  },
  CKB_INDEXER_URL: "https://testnet.ckb.dev/indexer",
  CKB_RPC_URL: "https://testnet.ckb.dev",
};

const v0Config: LightGodwokenConfig = {
  layer1Config: layer1ConfigAggron,
  layer2Config: {
    SCRIPTS: {
      deposit_lock: {
        script_type_hash: "0x5a2506bb68d81a11dcadad4cb7eae62a17c43c619fe47ac8037bc8ce2dd90360",
      },
      withdrawal_lock: {
        script_type_hash: "0x170ef156e9f6132dbca6069dfd3e436f7d91c29d3ac7332c4b33e633b6a299b5",
        cell_dep: {
          out_point: {
            tx_hash: "0xb4b07dcd1571ac18683b515ada40e13b99bd0622197b6817047adc9f407f4828",
            index: "0x0",
          },
          dep_type: "code",
        },
      },
      eth_account_lock: {
        script_type_hash: "0xdeec13a7b8e100579541384ccaf4b5223733e4a5483c3aec95ddc4c1d5ea5b22",
      },
    },
    ROLLUP_CONFIG: {
      rollup_type_hash: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a",
      rollup_type_script: {
        code_hash: "0x5c365147bb6c40e817a2a53e0dec3661f7390cc77f0c02db138303177b12e9fb",
        hash_type: "type",
        args: "0x213743d13048e9f36728c547ab736023a7426e15a3d7d1c82f43ec3b5f266df2",
      },
    },
    GW_POLYJUICE_RPC_URL: "https://godwoken-testnet-web3-rpc.ckbapp.dev",
  },
};

export const predefined_v1_1: Record<GodwokenVersion, LightGodwokenConfig> = {
  v0: v0Config,
  v1: {
    layer1Config: layer1ConfigAggron,
    layer2Config: {
      SCRIPTS: {
        // deposit_lock: {
        //   script_type_hash: "0x50704b84ecb4c4b12b43c7acb260ddd69171c21b4c0ba15f3c469b7d143f6f18",
        // },
        // withdrawal_lock: {
        //   script_type_hash: "0x06ae0706bb2d7997d66224741d3ec7c173dbb2854a6d2cf97088796b677269c6",
        //   cell_dep: {
        //     out_point: {
        //       tx_hash: "0xb4b07dcd1571ac18683b515ada40e13b99bd0622197b6817047adc9f407f4828",
        //       index: "0x0",
        //     },
        //     dep_type: "code",
        //   },
        // },
        // eth_account_lock: {
        //   script_type_hash: "0x07521d0aa8e66ef441ebc31204d86bb23fc83e9edc58c19dbb1b0ebe64336ec0",
        // },
        deposit_lock: {
          script_type_hash: "0xa37d1189629007c3c08242c4a87b563fe50652add0f3ba4e5059a1737d20d6e4",
        },
        withdrawal_lock: {
          script_type_hash: "0xb2c4cc6ee345632610e4e36872b15a291aaad63baf8e73ede3984e32d643bfe8",
          cell_dep: {
            out_point: {
              tx_hash: "0x309322839bd989c2f97f385dac774471c09643fe4f37ba9613e8dcc2e05bc539",
              index: "0x0",
            },
            dep_type: "code",
          },
        },
        eth_account_lock: {
          script_type_hash: "0x85e7c1efa93e8ca23ce91404654b31c008a6766637a4a5a08c44598d80746f35",
        },
      },
      ROLLUP_CONFIG: {
        // rollup_type_hash: "0x7b1a2b341e0c339263b2774d6ab228e223871322021f768815e6519550f99441",
        // rollup_type_script: {
        //   code_hash: "0x1e44736436b406f8e48a30dfbddcf044feb0c9eebfe63b0f81cb5bb727d84854",
        //   hash_type: "type",
        //   args: "0x7b98056f6b3191304d08d33b60ace0a788fb6d31160be5f13418cdce08b558fc",
        // },
        rollup_type_hash: "0x9ffbacfebfd9627e6f8f28004e32ec95ca857d72b3d1f6ef05f0c10c222399d7",
        rollup_type_script: {
          code_hash: "0x3bda219a967978d2db0316e36f6d39aaa713e1740752283cf184c4c195eeb48a",
          hash_type: "type",
          args: "0x375e628d7780e7f00bee16a63bc583b5ceb1ed779a4b2b4ab3f64381376e83ce",
        },
      },
      GW_POLYJUICE_RPC_URL: "https://godwoken-betanet-v1.ckbapp.dev",
    },
  },
};

export const predefined_v1: Record<GodwokenVersion, LightGodwokenConfig> = {
  v0: v0Config,
  v1: {
    layer1Config: layer1ConfigAggron,
    layer2Config: {
      SCRIPTS: {
        deposit_lock: {
          script_type_hash: "0xcc2b4e14d7dfeb1e72f7708ac2d7f636ae222b003bac6bccfcf8f4dfebd9c714",
        },
        withdrawal_lock: {
          script_type_hash: "0x318e8882bec0339fa20584f4791152e71d5b71c5dbd8bf988fd511373e142222",
          cell_dep: {
            out_point: {
              tx_hash: "0xb4b07dcd1571ac18683b515ada40e13b99bd0622197b6817047adc9f407f4828",
              index: "0x0",
            },
            dep_type: "code",
          },
        },
        eth_account_lock: {
          script_type_hash: "0x10571f91073fdc3cdef4ddad96b4204dd30d6355f3dda9a6d7fc0fa0326408da",
        },
      },
      ROLLUP_CONFIG: {
        rollup_type_hash: "0x4940246f168f4106429dc641add3381a44b5eef61e7754142f594e986671a575",
        rollup_type_script: {
          code_hash: "0x0d3bfeaa292a59fcb58ed026e8f14e2167bd27f1765aa4b2af7d842b6123c6a9",
          hash_type: "type",
          args: "0x8137c84a9089f92fee684ac840532ee1133b012a9d42b6b76b74fbdde6999230",
        },
      },
      GW_POLYJUICE_RPC_URL: "https://godwoken-testnet-web3-v1-rpc.ckbapp.dev",
    },
  },
};
