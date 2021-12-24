import detectEthereumProvider from "@metamask/detect-provider";
import React, { createContext, useEffect, useState } from "react";
import { LightGodwoken } from "../light-godwoken";
import DefaultLightGodwoken from "../light-godwoken/lightGodwoken";
import DefaultLightGodwokenProvider from "../light-godwoken/lightGodwokenProvider";

export const LightGodwokenContext = createContext<LightGodwoken | null>(null);

export const Provider: React.FC = (props) => {
  const [lightGodwoken, setLightGodwoken] = useState<LightGodwoken>();

  useEffect(() => {
    detectEthereumProvider().then((ethereum: any) => {
      ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        if (!accounts || !accounts[0]) return;

        const instance = new DefaultLightGodwoken(new DefaultLightGodwokenProvider(accounts[0], ethereum));
        setLightGodwoken(instance);
      });

      ethereum.on("accountsChanged", (accounts: string[] | undefined) => {
        if (!accounts || !accounts[0]) return setLightGodwoken(undefined);

        const provider = new DefaultLightGodwoken(new DefaultLightGodwokenProvider(ethereum.selectedAddress, ethereum));
        setLightGodwoken(provider);
      });
    });
  }, []);

  return <LightGodwokenContext.Provider value={lightGodwoken || null}>{props.children}</LightGodwokenContext.Provider>;
};
