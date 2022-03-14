import React, { useEffect, useState } from "react";
import { LightGodwokenV1, LightGodwoken } from "./light-godwoken/index";
import DefaultLightGodwokenProvider from "./light-godwoken/lightGodwokenProvider";
import detectEthereumProvider from "@metamask/detect-provider";
const Page: React.FunctionComponent = () => {
  const [lightGodwoken, setLightGodwoken] = useState<LightGodwoken>();
  useEffect(() => {
    detectEthereumProvider().then((ethereum: any) => {
      ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        console.log("eth_accounts:", accounts);

        if (!accounts || !accounts[0]) return;

        const instance = new LightGodwoken(new DefaultLightGodwokenProvider(accounts[0], ethereum));
        setLightGodwoken(instance);
      });

      ethereum.on("accountsChanged", (accounts: string[] | undefined) => {
        console.log("accountsChanged:", accounts);

        if (!accounts || !accounts[0]) return setLightGodwoken(undefined);

        const provider = new LightGodwokenV1(new DefaultLightGodwokenProvider(ethereum.selectedAddress, ethereum));
        setLightGodwoken(provider);
      });
    });
  }, []);
  const handleClick = () => {
    console.log("handle click", lightGodwoken);
    lightGodwoken!.withdrawWithEvent({
      capacity: "0x9c7652400", //420
      amount: "0x0",
      sudt_script_hash: `0x${"00".repeat(32)}`,
    });
  };
  return (
    <div>
      v1
      <button onClick={handleClick}>click</button>
    </div>
  );
};

export default Page;
