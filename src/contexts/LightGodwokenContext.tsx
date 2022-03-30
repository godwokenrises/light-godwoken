import detectEthereumProvider from "@metamask/detect-provider";
import React, { createContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  GODWOKEN_V1_BLOCK_EXPLORER_URL,
  GODWOKEN_V1_CHAIN_ID,
  GODWOKEN_V1_CHAIN_NAME,
  GODWOKEN_V1_NATIVE_CURRENCY_DECIMALS,
  GODWOKEN_V1_NATIVE_CURRENCY_NAME,
  GODWOKEN_V1_NATIVE_CURRENCY_SYMBOL,
  GODWOKEN_V1_RPC_URL,
} from "../config";
import { LightGodwokenV1, LightGodwoken } from "../light-godwoken/index";
import DefaultLightGodwoken from "../light-godwoken/lightGodwoken";
import DefaultLightGodwokenProvider from "../light-godwoken/lightGodwokenProvider";

export const LightGodwokenContext = createContext<DefaultLightGodwoken | null>(null);
LightGodwokenContext.displayName = "LightGodwokenContext";
const addNetwork = (ethereum: any) => {
  const params = [
    {
      chainId: GODWOKEN_V1_CHAIN_ID,
      chainName: GODWOKEN_V1_CHAIN_NAME,
      nativeCurrency: {
        name: GODWOKEN_V1_NATIVE_CURRENCY_NAME,
        symbol: GODWOKEN_V1_NATIVE_CURRENCY_SYMBOL,
        decimals: GODWOKEN_V1_NATIVE_CURRENCY_DECIMALS,
      },
      rpcUrls: [GODWOKEN_V1_RPC_URL],
      blockExplorerUrls: [GODWOKEN_V1_BLOCK_EXPLORER_URL],
    },
  ];
  ethereum
    .request({ method: "wallet_addEthereumChain", params })
    .catch((error: Error) => console.log("Error", error.message));
};

export const Provider: React.FC = (props) => {
  const [lightGodwoken, setLightGodwoken] = useState<DefaultLightGodwoken>();
  const location = useLocation();
  useEffect(() => {
    detectEthereumProvider().then((ethereum: any) => {
      if (location.pathname.startsWith("/v1")) {
        addNetwork(ethereum);
      }
      ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        if (!accounts || !accounts[0]) return;

        let instance: DefaultLightGodwoken;
        if (location.pathname.startsWith("/v0") && lightGodwoken?.getVersion() !== "v0") {
          instance = new LightGodwoken(new DefaultLightGodwokenProvider(accounts[0], ethereum, "v0"));
          setLightGodwoken(instance);
        } else if (location.pathname.startsWith("/v1") && lightGodwoken?.getVersion() !== "v1") {
          instance = new LightGodwokenV1(new DefaultLightGodwokenProvider(accounts[0], ethereum, "v1"));
          setLightGodwoken(instance);
        }
      });

      ethereum.on("accountsChanged", (accounts: string[] | undefined) => {
        if (!accounts || !accounts[0]) return setLightGodwoken(undefined);

        let instance: DefaultLightGodwoken;
        if (location.pathname.startsWith("/v0")) {
          instance = new LightGodwoken(new DefaultLightGodwokenProvider(accounts[0], ethereum, "v0"));
        } else {
          instance = new LightGodwokenV1(new DefaultLightGodwokenProvider(accounts[0], ethereum, "v1"));
        }
        setLightGodwoken(instance);
      });
    });
  }, [lightGodwoken, location.pathname]);

  return <LightGodwokenContext.Provider value={lightGodwoken || null}>{props.children}</LightGodwokenContext.Provider>;
};
