import detectEthereumProvider from "@metamask/detect-provider";
import React, { createContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  LightGodwokenV1 as DefaultLightGodwokenV1,
  LightGodwoken as DefaultLightGodwoken,
} from "../light-godwoken/index";
import DefaultLightGodwokenProvider from "../light-godwoken/lightGodwokenProvider";

export const LightGodwokenContext = createContext<DefaultLightGodwokenV1 | DefaultLightGodwoken | null>(null);
LightGodwokenContext.displayName = "LightGodwokenContext";
export const Provider: React.FC = (props) => {
  const [lightGodwoken, setLightGodwoken] = useState<DefaultLightGodwokenV1 | DefaultLightGodwoken>();
  const params = useParams();
  const version = params.version;
  console.log("version", version);
  useEffect(() => {
    console.log("params.version", params.version);
    detectEthereumProvider().then((ethereum: any) => {
      ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        if (!accounts || !accounts[0]) return;

        let instance: DefaultLightGodwokenV1 | DefaultLightGodwoken;
        if (params.version === "v0") {
          instance = new DefaultLightGodwoken(new DefaultLightGodwokenProvider(accounts[0], ethereum));
        } else {
          instance = new DefaultLightGodwokenV1(new DefaultLightGodwokenProvider(accounts[0], ethereum));
        }
        setLightGodwoken(instance);
      });

      ethereum.on("accountsChanged", (accounts: string[] | undefined) => {
        if (!accounts || !accounts[0]) return setLightGodwoken(undefined);

        let instance: DefaultLightGodwokenV1 | DefaultLightGodwoken;
        if (params.version === "v0") {
          instance = new DefaultLightGodwoken(new DefaultLightGodwokenProvider(accounts[0], ethereum));
        } else {
          instance = new DefaultLightGodwokenV1(new DefaultLightGodwokenProvider(accounts[0], ethereum));
        }
        setLightGodwoken(instance);
      });
    });
  }, [params.version]);

  return <LightGodwokenContext.Provider value={lightGodwoken || null}>{props.children}</LightGodwokenContext.Provider>;
};
