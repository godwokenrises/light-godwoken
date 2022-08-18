import { Layer1Config, LightGodwokenConfig, LightGodwokenConfigMap } from "./configTypes";

const layer1ConfigAggron: Layer1Config = {
  SCRIPTS: {
    omni_lock: {
      codeHash: "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
      hashType: "type",
      txHash: "0x9154df4f7336402114d04495175b37390ce86a4906d2d4001cf02c3e6d97f39c",
      index: "0x0",
      depType: "code",
    },
    secp256k1_blake160: {
      codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hashType: "type",
      txHash: "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
      index: "0x0",
      depType: "depGroup",
    },
    sudt: {
      codeHash: "0xc5e5dcf215925f7ef4dfaf5f4b4f105bc321c02776d6e7d52a1db3fcd9d011a4",
      hashType: "type",
      txHash: "0xe12877ebd2c3c364dc46c5c992bcfaf4fee33fa13eebdf82c591fc9825aab769",
      index: "0x0",
      depType: "code",
    },
  },
  CKB_INDEXER_URL: "https://testnet.ckb.dev/indexer",
  CKB_RPC_URL: "https://testnet.ckb.dev",
  SCANNER_URL: "https://pudge.explorer.nervos.org",
};

const layer1ConfigLina: Layer1Config = {
  SCRIPTS: {
    omni_lock: {
      codeHash: "0x9f3aeaf2fc439549cbc870c653374943af96a0658bd6b51be8d8983183e6f52f",
      hashType: "type",
      txHash: "0xaa8ab7e97ed6a268be5d7e26d63d115fa77230e51ae437fc532988dd0c3ce10a",
      index: "0x1",
      depType: "code",
    },
    secp256k1_blake160: {
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

// https://github.com/nervosnetwork/godwoken-info/blob/69175dff51fb63665abff7cc9640af5bf3409fea/testnet_v0/config/scripts-deploy-result.json
const v0ConfigAggron: LightGodwokenConfig = {
  layer1Config: layer1ConfigAggron,
  layer2Config: {
    SCRIPTS: {
      deposit_lock: {
        script_type_hash: "0x5a2506bb68d81a11dcadad4cb7eae62a17c43c619fe47ac8037bc8ce2dd90360",
        cell_dep: {
          outPoint: {
            txHash: "0x97614145cdec9ba924001c11cd49f1c424927437b40ed3ca3b82fff358f2e3de",
            index: "0x0",
          },
          depType: "code",
        },
      },
      withdrawal_lock: {
        script_type_hash: "0x170ef156e9f6132dbca6069dfd3e436f7d91c29d3ac7332c4b33e633b6a299b5",
        cell_dep: {
          outPoint: {
            txHash: "0xa8c2fe2aaaf405b2b1fd33dd63adc4c514a3d1f6dd1a64244489ad75c51a5d14",
            index: "0x0",
          },
          depType: "code",
        },
      },
      eth_account_lock: {
        script_type_hash: "0xdeec13a7b8e100579541384ccaf4b5223733e4a5483c3aec95ddc4c1d5ea5b22",
      },
    },
    ROLLUP_CONFIG: {
      rollup_type_hash: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a",
      rollup_type_script: {
        codeHash: "0x5c365147bb6c40e817a2a53e0dec3661f7390cc77f0c02db138303177b12e9fb",
        hashType: "type",
        args: "0x213743d13048e9f36728c547ab736023a7426e15a3d7d1c82f43ec3b5f266df2",
      },
    },
    GW_POLYJUICE_RPC_URL: "https://godwoken-testnet-web3-rpc.ckbapp.dev",
    SCANNER_URL: "https://aggron.gwscan.com",
    SCANNER_API: "https://api.aggron.gwscan.com/api/",
    CHAIN_NAME: "Godwoken Testnet v0",
    FINALITY_BLOCKS: 10000,
    BLOCK_PRODUCE_TIME: 45,
    MIN_CANCEL_DEPOSIT_TIME: 1200, // 20 minutes in seconds
    MULTICALL_ADDRESS: "0xaf98A74b133CD8373EE055b399b0cE19cF8C4523",
  },
};

// https://github.com/nervosnetwork/godwoken-info/blob/69175dff51fb63665abff7cc9640af5bf3409fea/mainnet_v0/config/scripts-result.json
const v0ConfigLina: LightGodwokenConfig = {
  layer1Config: layer1ConfigLina,
  layer2Config: {
    SCRIPTS: {
      deposit_lock: {
        script_type_hash: "0xe24164e2204f998b088920405dece3dcfd5c1fbcb23aecfce4b3d3edf1488897",
        cell_dep: {
          outPoint: {
            txHash: "0x23fe9d6410c93b49039a9efa3b1549ff18772c03919bc6f2aa91643c4caa01ba",
            index: "0x0",
          },
          depType: "code",
        },
      },
      withdrawal_lock: {
        script_type_hash: "0xf1717ee388b181fcb14352055c00b7ea7cd7c27350ffd1a2dd231e059dde2fed",
        cell_dep: {
          outPoint: {
            txHash: "0x3d727bd8bb1d87ba79638b63bfbf4c9a4feb9ac5ac5a0b356f3aaf4ccb4d3a1c",
            index: "0x0",
          },
          depType: "code",
        },
      },
      eth_account_lock: {
        script_type_hash: "0x1563080d175bf8ddd44a48e850cecf0c0b4575835756eb5ffd53ad830931b9f9",
      },
    },
    ROLLUP_CONFIG: {
      rollup_type_hash: "0x40d73f0d3c561fcaae330eabc030d8d96a9d0af36d0c5114883658a350cb9e3b",
      rollup_type_script: {
        codeHash: "0xa9267ff5a16f38aa9382608eb9022883a78e6a40855107bb59f8406cce00e981",
        hashType: "type",
        args: "0x2d8d67c8d73453c1a6d6d600e491b303910802e0cc90a709da9b15d26c5c48b3",
      },
    },
    GW_POLYJUICE_RPC_URL: "https://mainnet.godwoken.io/rpc",
    SCANNER_URL: "https://v0.gwscan.com",
    SCANNER_API: "https://api.gwscan.com/api/",
    CHAIN_NAME: "Godwoken v0 mainnet",
    FINALITY_BLOCKS: 3600,
    BLOCK_PRODUCE_TIME: 45,
    MIN_CANCEL_DEPOSIT_TIME: 172800, // two days

    MULTICALL_ADDRESS: "0x277FD6c744f7C16A997E5D626131eBd81d2D58Aa",
  },
};

// https://github.com/nervosnetwork/godwoken-info/blob/69175dff51fb63665abff7cc9640af5bf3409fea/testnet_v1_1/scripts-deploy-result.json
const v1ConfigAggron: LightGodwokenConfig = {
  layer1Config: layer1ConfigAggron,
  layer2Config: {
    SCRIPTS: {
      deposit_lock: {
        script_type_hash: "0x50704b84ecb4c4b12b43c7acb260ddd69171c21b4c0ba15f3c469b7d143f6f18",
        cell_dep: {
          outPoint: {
            txHash: "0x9caeec735f3cd2a60b9d12be59bb161f7c61ddab1ac22c4383a94c33ba6404a2",
            index: "0x0",
          },
          depType: "code",
        },
      },
      withdrawal_lock: {
        script_type_hash: "0x06ae0706bb2d7997d66224741d3ec7c173dbb2854a6d2cf97088796b677269c6",
        cell_dep: {
          outPoint: {
            txHash: "0x9c607a9a75ea4699dd01b1c2a478002343998cac8346d2aa582f35b532bd2b93",
            index: "0x0",
          },
          depType: "code",
        },
      },
      eth_account_lock: {
        script_type_hash: "0x07521d0aa8e66ef441ebc31204d86bb23fc83e9edc58c19dbb1b0ebe64336ec0",
      },
    },
    ROLLUP_CONFIG: {
      rollup_type_hash: "0x702359ea7f073558921eb50d8c1c77e92f760c8f8656bde4995f26b8963e2dd8",
      rollup_type_script: {
        codeHash: "0x1e44736436b406f8e48a30dfbddcf044feb0c9eebfe63b0f81cb5bb727d84854",
        hashType: "type",
        args: "0x86c7429247beba7ddd6e4361bcdfc0510b0b644131e2afb7e486375249a01802",
      },
    },
    GW_POLYJUICE_RPC_URL: "https://godwoken-testnet-v1.ckbapp.dev",
    SCANNER_URL: "https://v1.betanet.gwscan.com/",
    SCANNER_API: "https://api.v1.betanet.gwscan.com/api/",
    CHAIN_NAME: "Godwoken Testnet v1",
    FINALITY_BLOCKS: 100,
    BLOCK_PRODUCE_TIME: 30,
    MIN_CANCEL_DEPOSIT_TIME: 604800, // 7 days in seconds

    // https://github.com/mds1/multicall/blob/a6ed03f4bb232a573e9f6d4bdeca21a4edd3c1f7/README.md
    MULTICALL_ADDRESS: "0xcA11bde05977b3631167028862bE2a173976CA11",
  },
};

// https://github.com/nervosnetwork/godwoken-info/blob/69175dff51fb63665abff7cc9640af5bf3409fea/mainnet_v1/scripts-deploy-result.json
const v1ConfigLina: LightGodwokenConfig = {
  layer1Config: layer1ConfigLina,
  layer2Config: {
    SCRIPTS: {
      deposit_lock: {
        script_type_hash: "0xff602581f07667eef54232cce850cbca2c418b3418611c132fca849d1edcd775",
        cell_dep: {
          outPoint: {
            txHash: "0x61e576a7e5d2398ecc5b1a969d1af0142c87db0996c2f6fce41bf28f68d805b2",
            index: "0x0",
          },
          depType: "code",
        },
      },
      withdrawal_lock: {
        script_type_hash: "0x3714af858b8b82b2bb8f13d51f3cffede2dd8d352a6938334bb79e6b845e3658",
        cell_dep: {
          outPoint: {
            txHash: "0xe6389b5cf63eec1e2592e930414bc43f92508e529bdd5f5a07fa1dd140f4f20a",
            index: "0x0",
          },
          depType: "code",
        },
      },
      eth_account_lock: {
        script_type_hash: "0x096df264f38fff07f3acd318995abc2c71ae0e504036fe32bc38d5b6037364d4",
      },
    },
    ROLLUP_CONFIG: {
      rollup_type_hash: "0x1ca35cb5fda4bd542e71d94a6d5f4c0d255d6d6fba73c41cf45d2693e59b3072",
      rollup_type_script: {
        codeHash: "0xfef1d086d9f74d143c60bf03bd04bab29200dbf484c801c72774f2056d4c6718",
        hashType: "type",
        args: "0xab21bfe2bf85927bb42faaf3006a355222e24d5ea1d4dec0e62f53a8e0c04690",
      },
    },
    GW_POLYJUICE_RPC_URL: "https://v1.mainnet.godwoken.io/rpc",
    SCANNER_URL: "https://v1.gwscan.com/",
    SCANNER_API: "https://api.v1.gwscan.com/api/",
    CHAIN_NAME: "Godwoken Mainet v1",
    FINALITY_BLOCKS: 16800,
    // Assuming layer 1 block produce time is 12 secondes, layer 2 produces 1 block every 3 layer 1 blocks
    BLOCK_PRODUCE_TIME: 12 * 3,
    MIN_CANCEL_DEPOSIT_TIME: 604800,

    // https://github.com/mds1/multicall/commit/a6ed03f4bb232a573e9f6d4bdeca21a4edd3c1f7
    MULTICALL_ADDRESS: "0xcA11bde05977b3631167028862bE2a173976CA11",
  },
};

export const predefined_testnet: LightGodwokenConfigMap = {
  v0: v0ConfigAggron,
  v1: v1ConfigAggron,
};

export const predefined_mainnet: LightGodwokenConfigMap = {
  v0: v0ConfigLina,
  v1: v1ConfigLina,
};
