import * as LocalLayer2Config from './localLayer2Config'
const SCRIPTS_V0 = {
  deposit_lock: {
    script_type_hash: "0x5a2506bb68d81a11dcadad4cb7eae62a17c43c619fe47ac8037bc8ce2dd90360",
    cell_dep: {
      out_point: {
        tx_hash: "0x97614145cdec9ba924001c11cd49f1c424927437b40ed3ca3b82fff358f2e3de",
        index: "0x0",
      },
      dep_type: "code",
    },
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
    cell_dep: {
      out_point: {
        tx_hash: "0x2f9f8ec8a1556238aeeefed29e990d53ea75060ef04249371fd8b5246fffb8ea",
        index: "0x0",
      },
      dep_type: "code",
    },
  },
};
const ROLLUP_CONFIG_V0 = {
  rollup_type_hash: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a",
  rollup_type_script: {
    code_hash: "0x5c365147bb6c40e817a2a53e0dec3661f7390cc77f0c02db138303177b12e9fb",
    hash_type: "type",
    args: "0x213743d13048e9f36728c547ab736023a7426e15a3d7d1c82f43ec3b5f266df2",
  },
};
const SCRIPTS_V1 = {
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
    short_id: 0,
  },
  sudt: {
    code_hash: "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
    hash_type: "type",
    tx_hash: "0xe12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769",
    index: "0x0",
    dep_type: "code",
  },
};
const ROLLUP_CONFIG_V1 = {
  rollup_type_hash: "0x4940246f168f4106429dc641add3381a44b5eef61e7754142f594e986671a575",
  rollup_type_script: {
    code_hash: "0x0d3bfeaa292a59fcb58ed026e8f14e2167bd27f1765aa4b2af7d842b6123c6a9",
    hash_type: "type",
    args: "0x8137c84a9089f92fee684ac840532ee1133b012a9d42b6b76b74fbdde6999230",
  },
};

export type Layer2Config = {
  SCRIPTS: {
    deposit_lock: {
      script_type_hash: string;
    };
    withdrawal_lock: {
      script_type_hash: string;
      cell_dep: {
        out_point: {
          tx_hash: string;
          index: string;
        };
        dep_type: string;
      };
    };
    eth_account_lock: {
      script_type_hash: string;
    };
  };
  ROLLUP_CONFIG: {
    rollup_type_hash: string;
    rollup_type_script: {
      code_hash: string;
      hash_type: string;
      args: string;
    };
  };
};

export type Layer2Env = "local" | "testnet_v1" | "testnet_v0" | "mainnet";

export const getLayer2Config = (env: Layer2Env = "testnet_v1"): Layer2Config => {
  console.log(`getLayer2Config env: ${env}`);
  
  if (env === "testnet_v0") {
    return {
      SCRIPTS: SCRIPTS_V0,
      ROLLUP_CONFIG: ROLLUP_CONFIG_V0,
    };
  } else if (env === "testnet_v1") {
    return {
      SCRIPTS: SCRIPTS_V1,
      ROLLUP_CONFIG: ROLLUP_CONFIG_V1,
    };
  } else if (env === "local") {
    return {
      SCRIPTS: LocalLayer2Config.SCRIPTS,
      ROLLUP_CONFIG: LocalLayer2Config.ROLLUP_CONFIG,
    };
  } else if (env === "mainnet") {
    return {
      SCRIPTS: SCRIPTS_V1,
      ROLLUP_CONFIG: ROLLUP_CONFIG_V1,
    };
  }
  throw new Error("invalid env");
};
