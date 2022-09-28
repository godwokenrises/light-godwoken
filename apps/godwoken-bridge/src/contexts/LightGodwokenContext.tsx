import { isMainnet } from "../utils/environment";
import { useLocation } from "react-router-dom";
import detectEthereumProvider from "@metamask/detect-provider";
import React, { createContext, useEffect, useState } from "react";
import { GodwokenVersion, GodwokenNetwork, LightGodwoken } from "light-godwoken";
import { createLightGodwokenV0, createLightGodwokenV1 } from "../utils/lightGodwoken";

export const LightGodwokenContext = createContext<LightGodwoken | undefined>(undefined);
LightGodwokenContext.displayName = "LightGodwokenContext";

export const Provider: React.FC = (props) => {
  const [lightGodwoken, setLightGodwoken] = useState<LightGodwoken>();
  const location = useLocation();

  const network = isMainnet ? GodwokenNetwork.Mainnet : GodwokenNetwork.Testnet;

  useEffect(() => {
    detectEthereumProvider().then((ethereum: any) => {
      if (ethereum) {
        ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
          if (accounts.length === 0) {
            return setLightGodwoken(void 0);
          }

          if (location.pathname.startsWith("/v0") && lightGodwoken?.getVersion() !== GodwokenVersion.V0) {
            setLightGodwoken(createLightGodwokenV0(accounts[0], network, ethereum));
          } else if (location.pathname.startsWith("/v1") && lightGodwoken?.getVersion() !== GodwokenVersion.V1) {
            setLightGodwoken(createLightGodwokenV1(accounts[0], network, ethereum));
          }
        });

        ethereum.on("accountsChanged", (accounts: string[] | undefined) => {
          if (!accounts || accounts.length === 0) {
            return setLightGodwoken(void 0);
          }

          let instance: LightGodwoken;
          if (location.pathname.startsWith("/v0")) {
            instance = createLightGodwokenV0(accounts[0], network, ethereum);
          } else {
            instance = createLightGodwokenV1(accounts[0], network, ethereum);
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
