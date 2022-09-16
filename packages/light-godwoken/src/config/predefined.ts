import { GodwokenNetwork, LightGodwokenConfigMap } from "./types";
import { MainnetConfigMap } from "./predefined/mainnet";
import { TestnetConfigMap } from "./predefined/testnet";

export const predefinedConfigs: Record<GodwokenNetwork, LightGodwokenConfigMap> = {
  testnet: MainnetConfigMap,
  mainnet: TestnetConfigMap,
};
