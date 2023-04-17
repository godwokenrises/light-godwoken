import { GodwokenNetwork, GodwokenVersion } from "light-godwoken";

console.debug("env.REACT_APP_NETWORK: ", process.env.REACT_APP_NETWORK);
export const isMainnet = process.env.REACT_APP_NETWORK === GodwokenNetwork.Mainnet;
// Available network versions,
// some versions of the network is deprecated
export const availableNetworkVersions: Record<GodwokenNetwork, GodwokenVersion[]> = {
  [GodwokenNetwork.Mainnet]: [GodwokenVersion.V1, GodwokenVersion.V0],
  [GodwokenNetwork.Testnet]: [GodwokenVersion.V1],
};

export const availableVersions =
  availableNetworkVersions[isMainnet ? GodwokenNetwork.Mainnet : GodwokenNetwork.Testnet];
