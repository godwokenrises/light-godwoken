import { isMainnet } from "../utils/environment";
import { providers } from "ethers";
import { useLocation } from "react-router-dom";
import detectEthereumProvider from "@metamask/detect-provider";
import React, { createContext, useEffect, useState } from "react";
import {
  GodwokenNetwork,
  EthereumProvider,
  LightGodwokenV1,
  LightGodwokenV0,
  LightGodwoken,
  LightGodwokenProvider,
} from "light-godwoken";

export const LightGodwokenContext = createContext<LightGodwoken | undefined>(undefined);
LightGodwokenContext.displayName = "LightGodwokenContext";

export const Provider: React.FC = (props) => {
  const [lightGodwoken, setLightGodwoken] = useState<LightGodwoken>();
  const location = useLocation();

  const network = isMainnet ? GodwokenNetwork.Mainnet : GodwokenNetwork.Testnet;

  useEffect(() => {
    function createEthereumProvider(ethereum: providers.ExternalProvider) {
      return EthereumProvider.fromWeb3(ethereum);
    }
    function createLightGodwokenV0(account: string, ethereum: providers.ExternalProvider) {
      const ethereumProvider = createEthereumProvider(ethereum);
      return new LightGodwokenV0(new LightGodwokenProvider(account, ethereumProvider, network, "v0"));
    }
    function createLightGodwokenV1(account: string, ethereum: providers.ExternalProvider) {
      const ethereumProvider = createEthereumProvider(ethereum);
      return new LightGodwokenV1(new LightGodwokenProvider(account, ethereumProvider, network, "v1"));
    }

    detectEthereumProvider().then((ethereum: any) => {
      if (ethereum) {
        ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
          if (accounts.length === 0) {
            return setLightGodwoken(void 0);
          }

          if (location.pathname.startsWith("/v0") && lightGodwoken?.getVersion() !== "v0") {
            setLightGodwoken(createLightGodwokenV0(accounts[0], ethereum));
          } else if (location.pathname.startsWith("/v1") && lightGodwoken?.getVersion() !== "v1") {
            setLightGodwoken(createLightGodwokenV1(accounts[0], ethereum));
          }
        });

        ethereum.on("accountsChanged", (accounts: string[] | undefined) => {
          if (!accounts || accounts.length === 0) {
            return setLightGodwoken(void 0);
          }

          let instance: LightGodwoken;
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
  }, [lightGodwoken, location.pathname, network]);

  return (
    <LightGodwokenContext.Provider value={lightGodwoken || undefined}>{props.children}</LightGodwokenContext.Provider>
  );
};
