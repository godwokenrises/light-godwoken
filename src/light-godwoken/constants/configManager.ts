import { isMainnet } from "../env";
import { LightGodwokenConfig, LightGodwokenConfigMap } from "./configTypes";
import { predefined_testnet, predefined_mainnet } from "./lightGodwokenConfig";
import { writeStorage } from "@rehooks/local-storage";
import { GodwokenVersion } from "./configTypes";

export function getPredefinedConfig(): LightGodwokenConfigMap {
  return isMainnet ? predefined_mainnet : predefined_testnet;
}

// TODO deprecate initConfig, and refactor it to application level, `DefaultLightGodwokenProvider` would be design in stateless
export function initConfig(env: GodwokenVersion, lightGodwokenConfig?: LightGodwokenConfigMap): LightGodwokenConfig {
  const config = lightGodwokenConfig || getPredefinedConfig();
  if (!localStorage.getItem("advanced-settings")) {
    setAdvancedSettingsMap({
      v0: {
        MIN_CANCEL_DEPOSIT_TIME: config.v0.layer2Config.MIN_CANCEL_DEPOSIT_TIME,
      },
      v1: {
        MIN_CANCEL_DEPOSIT_TIME: config.v1.layer2Config.MIN_CANCEL_DEPOSIT_TIME,
      },
    });
  }
  return config[env];
}

type AdvancedSettings = {
  MIN_CANCEL_DEPOSIT_TIME: number;
};
type AdvancedSettingsMap = Record<GodwokenVersion, AdvancedSettings>;

export function getAdvancedSettings(version: GodwokenVersion): AdvancedSettings {
  let settings;
  try {
    settings = localStorage.getItem("advanced-settings");
    if (!settings) {
      throw new Error("[getAdvancedSettingsMap] Local advanced-settings is empty");
    }
    return JSON.parse(settings)[version];
  } catch (error) {
    return {
      MIN_CANCEL_DEPOSIT_TIME: getPredefinedConfig()[version].layer2Config.MIN_CANCEL_DEPOSIT_TIME,
    };
  }
}

function setAdvancedSettingsMap(settings: AdvancedSettingsMap) {
  writeStorage("advanced-settings", JSON.stringify(settings));
}
