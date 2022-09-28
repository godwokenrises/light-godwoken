import { MainnetTokenListV0, MainnetTokenListV1 } from "./predefined/mainnet";
import { TestnetTokenListV0, TestnetTokenListV1 } from "./predefined/testnet";
import { LightGodwokenTokenMap } from "./constants";
import { GodwokenNetwork } from "../config";

export const predefinedTokens: LightGodwokenTokenMap = {
  [GodwokenNetwork.Mainnet]: {
    v0: MainnetTokenListV0,
    v1: MainnetTokenListV1,
  },
  [GodwokenNetwork.Testnet]: {
    v0: TestnetTokenListV0,
    v1: TestnetTokenListV1,
  },
};
