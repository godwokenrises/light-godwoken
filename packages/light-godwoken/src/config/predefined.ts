import { GodwokenNetwork, LightGodwokenConfigMap } from "./types";
import testnet from "./predefined/testnet";
import mainnet from "./predefined/mainnet";

export const predefinedConfigs: Record<GodwokenNetwork, LightGodwokenConfigMap> = {
  testnet,
  mainnet,
};
