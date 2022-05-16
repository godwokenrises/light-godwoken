import { Layer1Config, LightGodwokenConfig } from "../constants/configTypes";
import { GodwokenVersion } from "../lightGodwokenType";

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
  SCANNER_URL: "",
};

export const testConfig: Record<GodwokenVersion, LightGodwokenConfig> = {
  v0: {
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
      SCANNER_URL: "",
      CHAIN_NAME: "",
    },
  },
  v1: {
    layer1Config: layer1ConfigAggron,
    layer2Config: {
      SCRIPTS: {
        deposit_lock: {
          script_type_hash: "0x50704b84ecb4c4b12b43c7acb260ddd69171c21b4c0ba15f3c469b7d143f6f18",
        },
        withdrawal_lock: {
          script_type_hash: "0x06ae0706bb2d7997d66224741d3ec7c173dbb2854a6d2cf97088796b677269c6",
          cell_dep: {
            out_point: {
              tx_hash: "0x9c607a9a75ea4699dd01b1c2a478002343998cac8346d2aa582f35b532bd2b93",
              index: "0x0",
            },
            dep_type: "code",
          },
        },
        eth_account_lock: {
          script_type_hash: "0x07521d0aa8e66ef441ebc31204d86bb23fc83e9edc58c19dbb1b0ebe64336ec0",
        },
      },
      ROLLUP_CONFIG: {
        rollup_type_hash: "0x702359ea7f073558921eb50d8c1c77e92f760c8f8656bde4995f26b8963e2dd8",
        rollup_type_script: {
          code_hash: "0x1e44736436b406f8e48a30dfbddcf044feb0c9eebfe63b0f81cb5bb727d84854",
          hash_type: "type",
          args: "0x86c7429247beba7ddd6e4361bcdfc0510b0b644131e2afb7e486375249a01802",
        },
      },
      GW_POLYJUICE_RPC_URL: "https://godwoken-testnet-v1.ckbapp.dev",
      CHAIN_NAME: "https://testnet.ckb.dev",
      SCANNER_URL: "",
    },
  },
};
