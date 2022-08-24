import { TOKEN_LIST_MAINNET_V0, TOKEN_LIST_MAINNET_V1 } from "./tokens/mainnet";
import { TOKEN_LIST_TESTNET_V0, TOKEN_LIST_TESTNET_V1 } from "./tokens/testnet";
import { LightGodwokenTokenMap, LightGodwokenToken } from "./constants";
import { GodwokenNetwork, GodwokenVersion } from "../config";

export const predefinedTokens: LightGodwokenTokenMap = {
  [GodwokenNetwork.Mainnet]: {
    v0: TOKEN_LIST_MAINNET_V0,
    v1: TOKEN_LIST_MAINNET_V1,
  },
  [GodwokenNetwork.Testnet]: {
    v0: TOKEN_LIST_TESTNET_V0,
    v1: TOKEN_LIST_TESTNET_V1,
  },
};

export function getTokenList(network: GodwokenNetwork | string, version: GodwokenVersion): LightGodwokenToken[] {
  if (!(network in predefinedTokens)) return [];

  const listMap = predefinedTokens[network as GodwokenNetwork];
  return listMap?.[version] ?? [];
}
