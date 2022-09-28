import { GodwokenNetwork, GodwokenVersion } from "../config";
import { LightGodwokenToken } from "./constants";
import { predefinedTokens } from "./predefined";

export function getTokenList(network: GodwokenNetwork | string, version: GodwokenVersion): LightGodwokenToken[] {
  if (!(network in predefinedTokens)) return [];

  const listMap = predefinedTokens[network as GodwokenNetwork];
  return listMap?.[version] ?? [];
}
