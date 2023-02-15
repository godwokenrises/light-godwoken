import { CellDep } from "@ckb-lumos/lumos";
import { Layer1ConfigScript } from "./types";

export function getCellDep(script: Layer1ConfigScript): CellDep {
  return {
    outPoint: {
      txHash: script.txHash,
      index: script.index,
    },
    depType: script.depType,
  };
}

export function isBrowser(): boolean {
  try {
    return window !== undefined;
  } catch {
    return false;
  }
}
