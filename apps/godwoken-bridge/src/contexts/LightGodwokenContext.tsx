import detectEthereumProvider from "@metamask/detect-provider";
import React, { createContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  EthereumProvider,
  LightGodwokenV1,
  LightGodwokenV0,
  LightGodwoken as DefaultLightGodwoken,
  LightGodwokenProvider as DefaultLightGodwokenProvider,
} from "light-godwoken";
import { providers } from "ethers";

export const LightGodwokenContext = createContext<DefaultLightGodwoken | undefined>(undefined);
LightGodwokenContext.displayName = "LightGodwokenContext";

export const Provider: React.FC = (props) => {
  const [lightGodwoken, setLightGodwoken] = useState<DefaultLightGodwoken>();
  const location = useLocation();

  function createEthereumProvider(ethereum: providers.ExternalProvider) {
    return EthereumProvider.fromWeb3(ethereum);
  }
  function createLightGodwokenV0(account: string, ethereum: providers.ExternalProvider) {
    const ethereumProvider = createEthereumProvider(ethereum);
    return new LightGodwokenV0(new DefaultLightGodwokenProvider(account, ethereumProvider, "v0"));
  }
  function createLightGodwokenV1(account: string, ethereum: providers.ExternalProvider) {
    const ethereumProvider = createEthereumProvider(ethereum);
    return new LightGodwokenV1(new DefaultLightGodwokenProvider(account, ethereumProvider, "v1"));
  }

  useEffect(() => {
    detectEthereumProvider().then((ethereum: any) => {
      if (ethereum) {
        ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
          if (!accounts || !accounts[0]) return;

          if (location.pathname.startsWith("/v0") && lightGodwoken?.getVersion() !== "v0") {
            setLightGodwoken(createLightGodwokenV0(accounts[0], ethereum));
          } else if (location.pathname.startsWith("/v1") && lightGodwoken?.getVersion() !== "v1") {
            setLightGodwoken(createLightGodwokenV1(accounts[0], ethereum));
          }
        });

        ethereum.on("accountsChanged", (accounts: string[] | undefined) => {
          if (!accounts || !accounts[0]) return setLightGodwoken(undefined);

          let instance: DefaultLightGodwoken;
          if (location.pathname.startsWith("/v0")) {
            instance = createLightGodwokenV0(accounts[0], ethereum);
          } else {
            instance = createLightGodwokenV1(accounts[0], ethereum);
          }

          setLightGodwoken(instance);
        });
      } else {
        alert("Please install MetaMask to use Godwoken Bridge!");
      }
    });
  }, [lightGodwoken, location.pathname]);

  return (
    <LightGodwokenContext.Provider value={lightGodwoken || undefined}>{props.children}</LightGodwokenContext.Provider>
  );
};
