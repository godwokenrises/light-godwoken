import { isMainnet } from "../utils/environment";
import { providers } from "ethers";
import { useLocation } from "react-router-dom";
import detectEthereumProvider from "@metamask/detect-provider";
import React, { createContext, useEffect, useState } from "react";
import { GodwokenVersion, GodwokenNetwork, LightGodwoken } from "light-godwoken";
import { createLightGodwokenV0, createLightGodwokenV1 } from "../utils/lightGodwoken";
import { ConfirmModal, PrimaryButton } from "../style/common";

export const LightGodwokenContext = createContext<LightGodwoken | undefined>(undefined);
LightGodwokenContext.displayName = "LightGodwokenContext";

export const Provider: React.FC = (props) => {
  const [lightGodwoken, setLightGodwoken] = useState<LightGodwoken>();
  const location = useLocation();
  const [showInstallTips, setShowInstallTips] = useState(false);

  const network = isMainnet ? GodwokenNetwork.Mainnet : GodwokenNetwork.Testnet;

  async function updateLightGodwokenByAccounts(ethereum: providers.ExternalProvider, accounts?: string[]) {
    if (!accounts || accounts.length === 0) {
      setLightGodwoken(void 0);
      return;
    }
    if (location.pathname.startsWith("/v0") && lightGodwoken?.getVersion() !== GodwokenVersion.V0) {
      setLightGodwoken(createLightGodwokenV0(accounts[0], network, ethereum));
      return;
    }
    if (location.pathname.startsWith("/v1") && lightGodwoken?.getVersion() !== GodwokenVersion.V1) {
      setLightGodwoken(createLightGodwokenV1(accounts[0], network, ethereum));
      return;
    }
  }
  async function updateLightGodwokenByEthereum(ethereum: providers.ExternalProvider) {
    const accounts = await ethereum.request?.({ method: "eth_accounts" });
    return updateLightGodwokenByAccounts(ethereum, accounts);
  }

  useEffect(() => {
    detectEthereumProvider().then((ethereum: any) => {
      if (ethereum) {
        updateLightGodwokenByEthereum(ethereum);
        ethereum.on("chainChanged", () => {
          updateLightGodwokenByEthereum(ethereum);
        });
        ethereum.on("accountsChanged", (accounts?: string[]) => {
          updateLightGodwokenByAccounts(ethereum, accounts);
        });
      } else {
        setShowInstallTips(true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightGodwoken, location.pathname, network]);

  return (
    <>
      <LightGodwokenContext.Provider value={lightGodwoken || undefined}>{props.children}</LightGodwokenContext.Provider>
      <ConfirmModal
        width={400}
        visible={showInstallTips}
        transitionName=""
        maskTransitionName=""
        footer={null}
        onCancel={() => setShowInstallTips(false)}
      >
        <div style={{ textAlign: "left", paddingTop: 24 }}>
          <h1>Tips</h1>
          <div>Please install MetaMask to use Godwoken Bridge!</div>
        </div>
        <PrimaryButton onClick={() => setShowInstallTips(false)}>Ok</PrimaryButton>
      </ConfirmModal>
    </>
  );
};
