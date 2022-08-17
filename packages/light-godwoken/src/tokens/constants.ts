import { GodwokenNetwork, GodwokenVersion } from "../config";

export const CKB_SUDT_ID = 1; // This is default sudt id for CKB on Godwoken

export interface LightGodwokenToken {
  id: number;
  symbol: string;
  name: string;
  decimals: number;
  tokenURI: string;
  address: string;
  l1LockArgs: string;
  layer1UAN: string;
  layer2UAN: string;
  layer1DisplayName?: string;
  layer2DisplayName?: string;
}

export type LightGodwokenTokenMap = Record<GodwokenNetwork, LightGodwokenTokenListMap>;
export type LightGodwokenTokenListMap = Record<GodwokenVersion, LightGodwokenToken[]>;
