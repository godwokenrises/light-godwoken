import { predefinedConfigs } from "./predefined";
import { getAdvancedSettingsMap, setAdvancedSettingsMap } from "./advanced";
import { LightGodwokenConfig, LightGodwokenConfigMap, GodwokenNetwork } from "./types";
import { LightGodwokenConfigNotFoundError, LightGodwokenConfigNotValidError } from "../constants/error";

export function getPredefinedConfig(network: GodwokenNetwork): LightGodwokenConfigMap {
  if (!predefinedConfigs[network])
    throw new LightGodwokenConfigNotFoundError(network, "LightGodwokenConfigMap not found");
  return predefinedConfigs[network];
}

export function initConfigMap(configOrNetwork: LightGodwokenConfigMap | GodwokenNetwork): LightGodwokenConfigMap {
  if (typeof configOrNetwork === "string") {
    return initConfigMap(getPredefinedConfig(configOrNetwork));
  }

  const config: LightGodwokenConfigMap = configOrNetwork;
  if (!getAdvancedSettingsMap()) {
    setAdvancedSettingsMap({
      v0: {
        MIN_CANCEL_DEPOSIT_TIME: config.v0.layer2Config.MIN_CANCEL_DEPOSIT_TIME,
      },
      v1: {
        MIN_CANCEL_DEPOSIT_TIME: config.v1.layer2Config.MIN_CANCEL_DEPOSIT_TIME,
      },
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
    throw new LightGodwokenConfigNotValidError(JSON.stringify(config), "config not valid.");
  }
}
