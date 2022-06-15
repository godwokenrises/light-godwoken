import { captureException } from "@sentry/react";
import { CellDep, Indexer } from "@ckb-lumos/lumos";
import { isMainnet } from "../env";
import { Godwoken } from "../godwoken/godwokenV1";
import { Layer2Config, LightGodwokenConfig, LightGodwokenConfigMap } from "./configTypes";
import { predefined_testnet, predefined_mainnet, predefined_acceptance_test } from "./lightGodwokenConfig";
import { writeStorage } from "@rehooks/local-storage";
import { debug } from "../debug";
import { GodwokenVersion } from "./configTypes";

export async function fetchLatestV1Config(config?: LightGodwokenConfig): Promise<Layer2Config> {
  const predefinedConfig = isMainnet ? predefined_mainnet.v1 : predefined_testnet.v1;
  const currentConfig = config || predefinedConfig;
  const godwokenClient = new Godwoken(predefinedConfig.layer2Config.GW_POLYJUICE_RPC_URL);
  const ckbIndexer = new Indexer(currentConfig.layer1Config.CKB_INDEXER_URL, currentConfig.layer1Config.CKB_RPC_URL);
  const rpcConfig = (await godwokenClient.getConfig()).nodeInfo;
  const newLayer2Config: Layer2Config = { ...currentConfig.layer2Config };
  const depositCellcollector = ckbIndexer.collector({ type: rpcConfig.gwScripts.deposit.script });
  newLayer2Config.SCRIPTS.deposit_lock.script_type_hash = rpcConfig.gwScripts.deposit.typeHash;
  for await (const cell of depositCellcollector.collect()) {
    const depositCellDep: CellDep = {
      out_point: {
        tx_hash: cell.out_point!.tx_hash,
        index: cell.out_point!.index,
      },
      dep_type: "code",
    };
    newLayer2Config.SCRIPTS.deposit_lock.cell_dep = depositCellDep;
  }
  const withdrawalCellcollector = ckbIndexer.collector({ type: rpcConfig.gwScripts.withdraw.script });
  newLayer2Config.SCRIPTS.withdrawal_lock.script_type_hash = rpcConfig.gwScripts.withdraw.typeHash;
  for await (const cell of withdrawalCellcollector.collect()) {
    const withdrawCellDep: CellDep = {
      out_point: {
        tx_hash: cell.out_point!.tx_hash,
        index: cell.out_point!.index,
      },
      dep_type: "code",
    };
    newLayer2Config.SCRIPTS.withdrawal_lock.cell_dep = withdrawCellDep;
  }
  newLayer2Config.ROLLUP_CONFIG.rollup_type_hash = rpcConfig.rollupCell.typeHash;
  newLayer2Config.ROLLUP_CONFIG.rollup_type_script = rpcConfig.rollupCell.typeScript;
  return newLayer2Config;
}

export function getCurrentConfigFromLocalStorage(): LightGodwokenConfigMap {
  return getConfigFromLocalStorage("current-config");
}

export function getLatestConfigFromLocalStorage(): LightGodwokenConfigMap {
  return getConfigFromLocalStorage("latest-config");
}

export function getConfigFromLocalStorage(path: string): LightGodwokenConfigMap {
  let config;
  try {
    const configString = localStorage.getItem(path);
    config = JSON.parse(configString!);
    if (!config) {
      throw new Error(`[getConfigFromLocalStorage] Local config path ${path} is empty`);
    }
  } catch (error) {
    captureException(error);
    debug("[getConfigFromLocalStorage] load config error", error);
    // config = isMainnet ? predefined_mainnet : predefined_testnet;
    config = isMainnet ? predefined_mainnet : predefined_acceptance_test;
  }
  return config;
}

export async function getLatestConfigFromRpc(): Promise<LightGodwokenConfigMap> {
  let config = getCurrentConfigFromLocalStorage();
  const latestV1Config = await fetchLatestV1Config(config.v1);
  const latestConfig = { ...config, v1: { ...config.v1, layer2Config: latestV1Config } };
  const isConfigChanged = JSON.stringify(config).toLowerCase() !== JSON.stringify(latestConfig).toLowerCase();
  if (isConfigChanged) {
    debug("[getLatestConfigFromRpc] config changed", config, latestConfig);
  } else {
    debug("[getLatestConfigFromRpc] latest config not changed");
  }
  return latestConfig;
}

export function setCurrentConfigToLocalStorage(config: LightGodwokenConfigMap): void {
  writeStorage("current-config", JSON.stringify(config));
}

export function setLatestConfigToLocalStorage(config: LightGodwokenConfigMap): void {
  writeStorage("latest-config", JSON.stringify(config));
}

export function initConfig(env: GodwokenVersion, lightGodwokenConfig?: LightGodwokenConfigMap): LightGodwokenConfig {
  const config = lightGodwokenConfig || getCurrentConfigFromLocalStorage();
  setCurrentConfigToLocalStorage(config);
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
      MIN_CANCEL_DEPOSIT_TIME: getCurrentConfigFromLocalStorage()[version].layer2Config.MIN_CANCEL_DEPOSIT_TIME,
    };
  }
}

export function setAdvancedSettingsMap(settings: AdvancedSettingsMap) {
  writeStorage("advanced-settings", JSON.stringify(settings));
}
