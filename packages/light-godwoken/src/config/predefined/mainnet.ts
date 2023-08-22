import { Layer1Config, LightGodwokenConfig, LightGodwokenConfigMap } from "../types";
import { predefined, createConfig } from "@ckb-lumos/config-manager";
import { predefinedTokens } from "../../tokens";

export const MainnetLayer1Config: Layer1Config = {
  SCRIPTS: {
    omniLock: {
      codeHash: "0x9f3aeaf2fc439549cbc870c653374943af96a0658bd6b51be8d8983183e6f52f",
      hashType: "type",
      txHash: "0xaa8ab7e97ed6a268be5d7e26d63d115fa77230e51ae437fc532988dd0c3ce10a",
      index: "0x1",
      depType: "code",
    },
    secp256k1Blake160: {
      codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hashType: "type",
      txHash: "0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c",
      index: "0x0",
      depType: "depGroup",
    },
    sudt: {
      codeHash: "0x5e7a36a77e68eecc013dfa2fe6a23f3b6c344b04005808694ae6dd45eea4cfd5",
      hashType: "type",
      txHash: "0xc7813f6a415144643970c2e88e0bb6ca6a8edc5dd7c1022746f628284a9936d5",
      index: "0x0",
      depType: "code",
    },
  },
  CKB_INDEXER_URL: "https://mainnet.ckb.dev/indexer",
  CKB_RPC_URL: "https://mainnet.ckb.dev/rpc",
  SCANNER_URL: "https://explorer.nervos.org",
};

export const MainnetLumosConfig = createConfig({
  ...predefined.LINA,
  SCRIPTS: {
    ...predefined.LINA.SCRIPTS,
    OMNILOCK: {
      ...predefined.LINA.SCRIPTS.OMNILOCK,
      CODE_HASH: MainnetLayer1Config.SCRIPTS.omniLock.codeHash,
      TX_HASH: MainnetLayer1Config.SCRIPTS.omniLock.txHash,
      INDEX: MainnetLayer1Config.SCRIPTS.omniLock.index,
    },
  },
});

// https://github.com/nervosnetwork/godwoken-info/blob/69175dff51fb63665abff7cc9640af5bf3409fea/mainnet_v0/config/scripts-result.json
export const MainnetLayer2ConfigV0: LightGodwokenConfig = {
  lumosConfig: MainnetLumosConfig,
  layer1Config: MainnetLayer1Config,
  layer2Config: {
    SCRIPTS: {
      depositLock: {
        scriptTypeHash: "0xe24164e2204f998b088920405dece3dcfd5c1fbcb23aecfce4b3d3edf1488897",
        cellDep: {
          outPoint: {
            txHash: "0x23fe9d6410c93b49039a9efa3b1549ff18772c03919bc6f2aa91643c4caa01ba",
            index: "0x0",
          },
          depType: "code",
        },
      },
      withdrawalLock: {
        scriptTypeHash: "0xf1717ee388b181fcb14352055c00b7ea7cd7c27350ffd1a2dd231e059dde2fed",
        cellDep: {
          outPoint: {
            txHash: "0x342dc7b96e663393fa606f05ae1ad8504fa776436d552677356b1023bb174beb",
            index: "0x0",
          },
          depType: "code",
        },
      },
      ethAccountLock: {
        scriptTypeHash: "0x1563080d175bf8ddd44a48e850cecf0c0b4575835756eb5ffd53ad830931b9f9",
      },
    },
    ROLLUP_CONFIG: {
      rollupTypeHash: "0x40d73f0d3c561fcaae330eabc030d8d96a9d0af36d0c5114883658a350cb9e3b",
      rollupTypeScript: {
        codeHash: "0xa9267ff5a16f38aa9382608eb9022883a78e6a40855107bb59f8406cce00e981",
        hashType: "type",
        args: "0x2d8d67c8d73453c1a6d6d600e491b303910802e0cc90a709da9b15d26c5c48b3",
      },
    },
    GW_POLYJUICE_RPC_URL: "https://mainnet.godwoken.io/rpc",
    SCANNER_URL: "https://v0.gwscan.com",
    SCANNER_API: "https://api.gwscan.com/api/",
    CHAIN_NAME: "Godwoken mainnet v0",
    FINALITY_BLOCKS: 3600,
    BLOCK_PRODUCE_TIME: 45,
    MIN_CANCEL_DEPOSIT_TIME: 172800, // two days

    MULTICALL_ADDRESS: "0x277FD6c744f7C16A997E5D626131eBd81d2D58Aa",
  },
  tokenList: predefinedTokens.mainnet.v0,
};

// https://github.com/nervosnetwork/godwoken-info/blob/69175dff51fb63665abff7cc9640af5bf3409fea/mainnet_v1/scripts-deploy-result.json
export const MainnetLayer2ConfigV1: LightGodwokenConfig = {
  lumosConfig: MainnetLumosConfig,
  layer1Config: MainnetLayer1Config,
  layer2Config: {
    SCRIPTS: {
      depositLock: {
        scriptTypeHash: "0xff602581f07667eef54232cce850cbca2c418b3418611c132fca849d1edcd775",
        cellDep: {
          outPoint: {
            txHash: "0x61e576a7e5d2398ecc5b1a969d1af0142c87db0996c2f6fce41bf28f68d805b2",
            index: "0x0",
          },
          depType: "code",
        },
      },
      withdrawalLock: {
        scriptTypeHash: "0x3714af858b8b82b2bb8f13d51f3cffede2dd8d352a6938334bb79e6b845e3658",
        cellDep: {
          outPoint: {
            txHash: "0xe6389b5cf63eec1e2592e930414bc43f92508e529bdd5f5a07fa1dd140f4f20a",
            index: "0x0",
          },
          depType: "code",
        },
      },
      ethAccountLock: {
        scriptTypeHash: "0x096df264f38fff07f3acd318995abc2c71ae0e504036fe32bc38d5b6037364d4",
      },
    },
    ROLLUP_CONFIG: {
      rollupTypeHash: "0x1ca35cb5fda4bd542e71d94a6d5f4c0d255d6d6fba73c41cf45d2693e59b3072",
      rollupTypeScript: {
        codeHash: "0xfef1d086d9f74d143c60bf03bd04bab29200dbf484c801c72774f2056d4c6718",
        hashType: "type",
        args: "0xab21bfe2bf85927bb42faaf3006a355222e24d5ea1d4dec0e62f53a8e0c04690",
      },
    },
    GW_POLYJUICE_RPC_URL: "https://v1.mainnet.godwoken.io/rpc",
    SCANNER_URL: "https://v1.gwscan.com/",
    SCANNER_API: "https://api.v1.gwscan.com/api/",
    CHAIN_NAME: "Godwoken Mainnet v1",
    FINALITY_BLOCKS: 16800,
    BLOCK_PRODUCE_TIME: 36, // L2 average block produce time from GwScan
    MIN_CANCEL_DEPOSIT_TIME: 604800,

    // https://github.com/mds1/multicall/commit/a6ed03f4bb232a573e9f6d4bdeca21a4edd3c1f7
    MULTICALL_ADDRESS: "0xcA11bde05977b3631167028862bE2a173976CA11",
  },
  tokenList: predefinedTokens.mainnet.v1,
};

export const MainnetConfigMap: LightGodwokenConfigMap = {
  v0: MainnetLayer2ConfigV0,
  v1: MainnetLayer2ConfigV1,
};
