import { CellDep } from "@ckb-lumos/lumos";
import { ScriptType } from "./configTypes";

export const getCellDep = (script: ScriptType): CellDep => {
  return {
    outPoint: {
      txHash: script.txHash,
      index: script.index,
    },
    depType: script.depType,
  };
};
