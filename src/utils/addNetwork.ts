import {
  GODWOKEN_V1_BLOCK_EXPLORER_URL,
  GODWOKEN_V1_CHAIN_NAME,
  GODWOKEN_V1_NATIVE_CURRENCY_DECIMALS,
  GODWOKEN_V1_NATIVE_CURRENCY_NAME,
  GODWOKEN_V1_NATIVE_CURRENCY_SYMBOL,
} from "../config";

export const addNetwork = (ethereum: any, chainId: string, rpcUrl: string) => {
  const params = [
    {
      chainId: chainId,
      chainName: GODWOKEN_V1_CHAIN_NAME,
      nativeCurrency: {
        name: GODWOKEN_V1_NATIVE_CURRENCY_NAME,
        symbol: GODWOKEN_V1_NATIVE_CURRENCY_SYMBOL,
        decimals: Number(GODWOKEN_V1_NATIVE_CURRENCY_DECIMALS),
      },
      rpcUrls: [rpcUrl],
      blockExplorerUrls: [GODWOKEN_V1_BLOCK_EXPLORER_URL],
    },
  ];
  ethereum
    .request({ method: "wallet_addEthereumChain", params })
    .catch((error: Error) => console.log("Error", error.message));
};
