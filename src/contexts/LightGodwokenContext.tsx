import detectEthereumProvider from "@metamask/detect-provider";
import React, { createContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LightGodwoken } from "../light-godwoken";
import { LightGodwoken as DefaultLightGodwoken } from "../light-godwoken/index";
import DefaultLightGodwokenProvider from "../light-godwoken/lightGodwokenProvider";

export const LightGodwokenContext = createContext<LightGodwoken | null>(null);

export const Provider: React.FC = (props) => {
  const [lightGodwoken, setLightGodwoken] = useState<LightGodwoken>();
  const params = useParams();
  const version = params.version;
  useEffect(() => {
    detectEthereumProvider().then((ethereum: any) => {
      ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        if (!accounts || !accounts[0]) return;

        let instance: LightGodwoken;
        if (version === "v0") {
          instance = new DefaultLightGodwoken(new DefaultLightGodwokenProvider(accounts[0], ethereum));
        } else {
          instance = new DefaultLightGodwoken(new DefaultLightGodwokenProvider(accounts[0], ethereum));
        }
        setLightGodwoken(instance);
      });

      ethereum.on("accountsChanged", (accounts: string[] | undefined) => {
        if (!accounts || !accounts[0]) return setLightGodwoken(undefined);

        let instance: LightGodwoken;
        if (version === "v0") {
          instance = new DefaultLightGodwoken(new DefaultLightGodwokenProvider(accounts[0], ethereum));
        } else {
          instance = new DefaultLightGodwoken(new DefaultLightGodwokenProvider(accounts[0], ethereum));
        }
      });
    });
  }, []);

  return <LightGodwokenContext.Provider value={lightGodwoken || null}>{props.children}</LightGodwokenContext.Provider>;
};
