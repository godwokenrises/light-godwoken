import { isMainnet } from "../utils/environment";
import { useLocation } from "react-router-dom";
import React, { createContext, useEffect, useState } from "react";
import { GodwokenVersion, GodwokenNetwork, LightGodwoken } from "light-godwoken";
import { createLightGodwokenV0, createLightGodwokenV1 } from "../utils/lightGodwoken";
import { useWeb3React } from "@web3-react/core";

export const LightGodwokenContext = createContext<LightGodwoken | undefined>(undefined);
LightGodwokenContext.displayName = "LightGodwokenContext";

export const Provider: React.FC = (props) => {
  const [lightGodwoken, setLightGodwoken] = useState<LightGodwoken>();
  const location = useLocation();

  const network = isMainnet ? GodwokenNetwork.Mainnet : GodwokenNetwork.Testnet;

  const { connector, account } = useWeb3React();

  useEffect(() => {
    if (account && connector.provider) {
      if (location.pathname.startsWith("/v0") && lightGodwoken?.getVersion() !== GodwokenVersion.V0) {
        setLightGodwoken(createLightGodwokenV0(account, network, connector.provider));
      } else if (location.pathname.startsWith("/v1") && lightGodwoken?.getVersion() !== GodwokenVersion.V1) {
        setLightGodwoken(createLightGodwokenV1(account, network, connector.provider));
      }
      
      connector.provider.on("accountsChanged", (accounts: string[] | undefined) => {
        if (!accounts || accounts.length === 0) {
          return setLightGodwoken(void 0);
        }
  
        let instance: LightGodwoken;
        if (location.pathname.startsWith("/v0")) {
          instance = createLightGodwokenV0(accounts[0], network, connector.provider!);
        } else {
          instance = createLightGodwokenV1(accounts[0], network, connector.provider!);
        }
  
        setLightGodwoken(instance);
      });
    }
  }, [lightGodwoken, location.pathname, network, account, connector]);

  return (
    <LightGodwokenContext.Provider value={lightGodwoken || undefined}>{props.children}</LightGodwokenContext.Provider>
  );
};
