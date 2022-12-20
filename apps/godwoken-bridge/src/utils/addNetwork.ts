import { LightGodwokenV1, EthereumProvider } from "light-godwoken";

export const addNetwork = async (ethereum: EthereumProvider, lightGodwokenV1: LightGodwokenV1) => {
  const chainId = await lightGodwokenV1.getChainId();

  try {
    await ethereum.send("wallet_switchEthereumChain", [
      {
        chainId,
      },
    ]);
  } catch (error: any) {
    console.log("wallet_switchEthereumChain", error.message);

    // If the network doesn't exist
    if (error?.code === 4902) {
      const layer2Config = lightGodwokenV1.getConfig().layer2Config;
      const nativeToken = lightGodwokenV1.getNativeAsset();

      try {
        await ethereum.send("wallet_addEthereumChain", [
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
        ]);
      } catch (error: any) {
        console.log("wallet_addEthereumChain", error.message);
      }
    }
  }
};
