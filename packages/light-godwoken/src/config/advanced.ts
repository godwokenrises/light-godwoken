import { GodwokenVersion, GodwokenNetwork } from "./types";
import { getPredefinedConfig } from "./config";

export interface AdvancedSettings {
  MIN_CANCEL_DEPOSIT_TIME: number;
}
export type AdvancedSettingsMap = Record<GodwokenVersion, AdvancedSettings>;
export function getAdvancedSettings(network: GodwokenNetwork, version: GodwokenVersion): AdvancedSettings {
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
  if (window.localStorage) {
    window.localStorage.setItem("advanced-settings", JSON.stringify(settings));
  } else {
    advanced.value = settings;
  }
}
export function getAdvancedSettingsMap() {
  if (window.localStorage) {
    try {
      const stored = window.localStorage.getItem("advanced-settings");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("[getAdvancedSettingsMap] Local advanced-settings is empty");
    }
  } else {
    return advanced.value;
  }
}
