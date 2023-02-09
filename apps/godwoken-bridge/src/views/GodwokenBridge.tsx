import "antd/dist/antd.css";
import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import Page from "../components/Layout/Page";
import PageHeader from "../components/Layout/PageHeader";
import PageFooter from "../components/Layout/PageFooter";
import { addNetwork } from "../utils/addNetwork";
import { useLightGodwoken } from "../hooks/useLightGodwoken";
import { GodwokenVersion, LightGodwokenV1 } from "light-godwoken";
import { availableVersions } from "../utils/environment";
import { NetworkMismatchModal } from "../components/NetworkMismatchModal";

export default function GodwokenBridge() {
  const lightGodwoken = useLightGodwoken();
  const [displayNetworkName, setDisplayNetworkName] = useState("");

  const [isModalVisible, setIsModalVisible] = useState(false);

  const params = useParams();
  const version = params.version;

  useEffect(() => {
    if (lightGodwoken instanceof LightGodwokenV1) {
      const ethereum = lightGodwoken.provider.ethereum;
      ethereum.provider.getNetwork().then(async (network) => {
        const chainId = network.chainId;
        const godWokenChainId = parseInt(await lightGodwoken.getChainId(), 16);
        if (chainId !== godWokenChainId) {
          const lightGodwokenConfig = lightGodwoken.getConfig();
          const networkName = lightGodwokenConfig.layer2Config.CHAIN_NAME;
          setDisplayNetworkName(networkName);
          setIsModalVisible(true);
        }
      });
    }
  }, [lightGodwoken, params]);

  const changeChain = () => {
    if (lightGodwoken instanceof LightGodwokenV1) {
      const ethereum = lightGodwoken.provider.ethereum;
      addNetwork(ethereum, lightGodwoken).then();
      (ethereum.provider as any).provider.on?.("chainChanged", () => {
        setIsModalVisible(false);
      });
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  if (!version || !availableVersions.includes(version as GodwokenVersion)) {
    return <Navigate to={`/v1/${params["*"]}`} />;
  }

  return (
    <Page>
      <PageHeader />
      <Outlet />
      <PageFooter />
      <NetworkMismatchModal
        visible={isModalVisible}
        networkName={displayNetworkName}
        handleCancel={handleCancel}
        handleConfirm={changeChain}
      />
    </Page>
  );
}
