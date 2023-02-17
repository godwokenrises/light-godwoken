import "antd/dist/antd.css";
import React from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import Page from "../components/Layout/Page";
import PageHeader from "../components/Layout/PageHeader";
import PageFooter from "../components/Layout/PageFooter";
import { GodwokenVersion } from "light-godwoken";
import { availableVersions } from "../utils/environment";
import NetworkMismatchAlert from "../components/NetworkMismatchAlert";

export default function GodwokenBridge() {
  const params = useParams();
  const version = params.version;
  if (!version || !availableVersions.includes(version as GodwokenVersion)) {
    return <Navigate to={`/v1/${params["*"]}`} />;
  }

  return (
    <Page>
      <NetworkMismatchAlert />
      <PageHeader />
      <Outlet />
      <PageFooter />
    </Page>
  );
}
