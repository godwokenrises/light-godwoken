import "antd/dist/antd.css";
import React from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import Page from "../components/Layout/Page";
import PageHeader from "../components/Layout/PageHeader";
import PageFooter from "../components/Layout/PageFooter";
import { addNetwork } from "../utils/addNetwork";
import { useLightGodwoken } from "../hooks/useLightGodwoken";
import { LightGodwokenV1 } from "light-godwoken";

export default function GodwokenBridge() {
  const lightGodwoken = useLightGodwoken();
  if (lightGodwoken instanceof LightGodwokenV1) {
    addNetwork(lightGodwoken.provider.ethereum, lightGodwoken);
  }

  const params = useParams();
  if (!params.version || !["v0", "v1"].includes(params.version)) {
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
