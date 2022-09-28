import { predefinedConfigs } from "./predefined";
import { getStoredAdvancedSettings, setAdvancedSettings } from "./advanced";
import { LightGodwokenConfig, GodwokenNetwork, GodwokenVersion } from "./types";
import { LightGodwokenConfigNotFoundError, LightGodwokenConfigNotValidError } from "../constants/error";

export function getPredefinedConfig(network: GodwokenNetwork | string, version: GodwokenVersion): LightGodwokenConfig {
  if (!(network in predefinedConfigs)) {
    throw new LightGodwokenConfigNotFoundError(network, "No predefined LightGodwokenConfig matches the network");
  }

  const configMap = predefinedConfigs[network as GodwokenNetwork];
  if (!(version in configMap)) {
    throw new LightGodwokenConfigNotFoundError(network, "No predefined LightGodwokenConfig is matches the version");
  }

  return configMap[version];
}

export function initConfig(
  configOrNetwork: LightGodwokenConfig | GodwokenNetwork | string,
  version: GodwokenVersion,
): LightGodwokenConfig {
  if (typeof configOrNetwork === "string") {
    const predefinedConfig = getPredefinedConfig(configOrNetwork, version);
    return initConfig(predefinedConfig, version);
  }

  const config: LightGodwokenConfig = configOrNetwork;
  if (!getStoredAdvancedSettings(version)) {
    setAdvancedSettings(version, {
      MIN_CANCEL_DEPOSIT_TIME: config.layer2Config.MIN_CANCEL_DEPOSIT_TIME,
    });
  }

  return config;
}

export function validateLightGodwokenConfig(config: LightGodwokenConfig): asserts config is LightGodwokenConfig {
  if (
    !config ||
    !config.layer2Config ||
    !config.layer2Config.SCRIPTS ||
    !config.layer2Config.ROLLUP_CONFIG ||
    !config.layer2Config.GW_POLYJUICE_RPC_URL ||
    !config.layer1Config ||
    !config.layer1Config.SCRIPTS ||
    !config.layer1Config.CKB_INDEXER_URL ||
    !config.layer1Config.CKB_RPC_URL
  ) {
    throw new LightGodwokenConfigNotValidError(JSON.stringify(config), "Invalid config");
  }
}
