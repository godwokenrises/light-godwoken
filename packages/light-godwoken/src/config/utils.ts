import { CellDep } from "@ckb-lumos/lumos";
import { ScriptType } from "./types";

export const getCellDep = (script: ScriptType): CellDep => {
  return {
    out_point: {
      tx_hash: script.tx_hash,
      index: script.index,
    },
    dep_type: script.dep_type,
  };
};
