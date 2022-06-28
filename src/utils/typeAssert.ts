import { LightGodwokenV0, LightGodwokenV1 } from "../light-godwoken/lightGodwokenType";

export const isInstanceOfLightGodwokenV0 = (instance: unknown): instance is LightGodwokenV0 => {
  return typeof instance === "object" && instance !== null && "withdrawToV1WithEvent" in instance;
};

export function assertsLightGodwokenV0(instance: unknown): asserts instance is LightGodwokenV0 {
  if (!isInstanceOfLightGodwokenV0(instance)) {
    throw new Error("instance must be instance of LightGodwokenV0");
  }
}

export const isInstanceOfLightGodwokenV1 = (instance: unknown): instance is LightGodwokenV1 => {
  return typeof instance === "object" && instance !== null && "getChainId" in instance;
};
