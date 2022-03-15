import { CellDep, DepType } from "@ckb-lumos/lumos";

export const LAYER1_CONFIG = {
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
}

export const OMNI_LOCK_CELL_DEP: CellDep = {
  out_point: {
    tx_hash: LAYER1_CONFIG.omni_lock.tx_hash,
    index: LAYER1_CONFIG.omni_lock.index,
  },
  dep_type: LAYER1_CONFIG.omni_lock.dep_type as DepType,
};

export const SECP256K1_BLACK160_CELL_DEP: CellDep ={
  out_point: {
    tx_hash: LAYER1_CONFIG.secp256k1_blake160.tx_hash,
    index: LAYER1_CONFIG.secp256k1_blake160.index,
  },
  dep_type: LAYER1_CONFIG.secp256k1_blake160.dep_type as DepType,
}

export const SUDT_CELL_DEP: CellDep ={
  out_point: {
    tx_hash: LAYER1_CONFIG.sudt.tx_hash,
    index: LAYER1_CONFIG.sudt.index,
  },
  dep_type: LAYER1_CONFIG.sudt.dep_type as DepType,
};