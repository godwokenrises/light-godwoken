import { LightGodwokenV1 } from "../light-godwoken";

export const addNetwork = async (ethereum: any, lightGodwokenV1: LightGodwokenV1) => {
  const chainId = await lightGodwokenV1.getChainId();
  const layer2Config = lightGodwokenV1.getConfig().layer2Config;
  const nativeToken = lightGodwokenV1.getNativeAsset();

  const params = [
    {
      chainId: chainId,
      chainName: layer2Config.CHAIN_NAME,
      nativeCurrency: {
        name: nativeToken.name,
        symbol: nativeToken.symbol,
        decimals: nativeToken.decimals,
      },
      rpcUrls: [layer2Config.GW_POLYJUICE_RPC_URL],
      blockExplorerUrls: [layer2Config.SCANNER_URL],
    },
  ];
  ethereum
    .request({ method: "wallet_addEthereumChain", params })
    .catch((error: Error) => console.log("Error", error.message));
};
