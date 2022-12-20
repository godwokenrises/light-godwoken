import "antd/dist/antd.css";
import React, { useEffect } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import Page from "../components/Layout/Page";
import PageHeader from "../components/Layout/PageHeader";
import PageFooter from "../components/Layout/PageFooter";
import { addNetwork } from "../utils/addNetwork";
import { useLightGodwoken } from "../hooks/useLightGodwoken";
import { GodwokenVersion, LightGodwokenV1 } from "light-godwoken";
import { availableVersions } from "../utils/environment";

export default function GodwokenBridge() {
  const lightGodwoken = useLightGodwoken();

  const params = useParams();
  const version = params.version;

  useEffect(() => {
    if (lightGodwoken instanceof LightGodwokenV1) {
      const ethereum = lightGodwoken.provider.ethereum;
      addNetwork(ethereum, lightGodwoken);
      (ethereum.provider as any).provider.on?.("chainChanged", () => {
        addNetwork(ethereum, lightGodwoken);
      });
    }
  }, [lightGodwoken, params]);

  if (!version || !availableVersions.includes(version as GodwokenVersion)) {
    return <Navigate to={`/v1/${params["*"]}`} />;
  }

  return (
    <Page>
      <PageHeader />
      <Outlet />
      <PageFooter />
    </Page>
  );
}
