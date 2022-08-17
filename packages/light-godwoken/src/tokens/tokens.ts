import { TOKEN_LIST_MAINNET_V0, TOKEN_LIST_MAINNET_V1 } from "./tokens/mainnet";
import { TOKEN_LIST_TESTNET_V0, TOKEN_LIST_TESTNET_V1 } from "./tokens/testnet";
import { TokenListNotFoundError } from "../constants/error";
import { GodwokenNetwork, GodwokenVersion } from "../config";
import { LightGodwokenTokenMap, LightGodwokenToken } from "./constants";

export const tokens: LightGodwokenTokenMap = {
  [GodwokenNetwork.Mainnet]: {
    v0: TOKEN_LIST_MAINNET_V0,
    v1: TOKEN_LIST_MAINNET_V1,
  },
  [GodwokenNetwork.Testnet]: {
    v0: TOKEN_LIST_TESTNET_V0,
    v1: TOKEN_LIST_TESTNET_V1,
  },
};

export function getTokenList(network: GodwokenNetwork, version: GodwokenVersion): LightGodwokenToken[] {
  if (!tokens[network]) throw new TokenListNotFoundError(network, "GodwokenNetwork not found");
  const listMap = tokens[network];

  if (!listMap[version]) throw new TokenListNotFoundError(version, "GodwokenVersion not found");
  return listMap[version];
}
