import { GodwokenVersion, GodwokenNetwork } from "./types";
import { getPredefinedConfig } from "./config";
import { isBrowser } from "./utils";
import { debug } from "../debug";

export interface AdvancedSettings {
  MIN_CANCEL_DEPOSIT_TIME: number;
}
export type AdvancedSettingsMap = {
  [key in GodwokenVersion]?: AdvancedSettings;
};
export function getAdvancedSettings(network: GodwokenNetwork | string, version: GodwokenVersion): AdvancedSettings {
  const stored = getStoredAdvancedSettings(version);
  if (stored) return stored;

  const config = getPredefinedConfig(network, version);
  return {
    MIN_CANCEL_DEPOSIT_TIME: config.layer2Config.MIN_CANCEL_DEPOSIT_TIME,
  };
}

export interface StoredAdvanceSettings {
  value: AdvancedSettingsMap;
}
export const advanced: StoredAdvanceSettings = {
  value: {},
};

export function setAdvancedSettings(version: GodwokenVersion, settings: AdvancedSettings) {
  if (isBrowser()) {
    const storage = Reflect.get(window, "localStorage");
    storage.setItem(`advanced-settings-${version}`, JSON.stringify(settings));
  } else {
    advanced.value[version] = settings;
  }
}
export function getStoredAdvancedSettings(version: GodwokenVersion): AdvancedSettings | undefined {
  if (isBrowser()) {
    try {
      const storage = Reflect.get(window, "localStorage");
      const stored = storage.getItem(`advanced-settings-${version}`);
      return stored ? (JSON.parse(stored) as AdvancedSettings) : void 0;
    } catch (e) {
      debug("[getStoredAdvancedSettings] Local advanced-settings is empty");
      return void 0;
    }
  } else {
    return advanced.value?.[version];
  }
}
