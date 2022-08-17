import { GodwokenVersion, GodwokenNetwork } from "./types";
import { getPredefinedConfig } from "./config";
import { isBrowser } from "./utils";

export interface AdvancedSettings {
  MIN_CANCEL_DEPOSIT_TIME: number;
}
export type AdvancedSettingsMap = Record<GodwokenVersion, AdvancedSettings>;
export function getAdvancedSettings(network: GodwokenNetwork | string, version: GodwokenVersion): AdvancedSettings {
  const stored = getAdvancedSettingsMap();
  if (stored) return stored[version];

  const config = getPredefinedConfig(network);
  return {
    MIN_CANCEL_DEPOSIT_TIME: config[version].layer2Config.MIN_CANCEL_DEPOSIT_TIME,
  };
}

export interface StoredAdvanceSettings {
  value?: AdvancedSettingsMap;
}
export const advanced: StoredAdvanceSettings = {
  value: void 0,
};
export function setAdvancedSettingsMap(settings: AdvancedSettingsMap) {
  if (isBrowser()) {
    const storage = Reflect.get(window, "localStorage");
    storage.setItem("advanced-settings", JSON.stringify(settings));
  } else {
    advanced.value = settings;
  }
}
export function getAdvancedSettingsMap() {
  if (isBrowser()) {
    try {
      const storage = Reflect.get(window, "localStorage");
      const stored = storage.getItem("advanced-settings");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("[getAdvancedSettingsMap] Local advanced-settings is empty");
    }
  } else {
    return advanced.value;
  }
}
