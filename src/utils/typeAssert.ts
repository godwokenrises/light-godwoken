import { MockLightGodwokenV0Interface } from "../contexts/MockLightGodwokenV0";
import { LightGodwokenV1 } from "../light-godwoken/lightGodwokenType";

export const isInstanceOfLightGodwokenV0 = (instance: unknown): instance is MockLightGodwokenV0Interface => {
  return typeof instance === "object" && instance !== null && "withdrawToV1WithEvent" in instance;
};

export const isInstanceOfLightGodwokenV1 = (instance: unknown): instance is LightGodwokenV1 => {
  return typeof instance === "object" && instance !== null && "getChainId" in instance;
};
