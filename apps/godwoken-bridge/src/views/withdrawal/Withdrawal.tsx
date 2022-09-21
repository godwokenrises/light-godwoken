import { GodwokenVersion } from "light-godwoken";
import React from "react";
import WithdrawalV0 from "./WithdrawalV0";
import WithdrawalV1 from "./WithdrawalV1";
import { Placeholder } from "../../components/Placeholder";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";

export default function Withdrawal() {
  const lightGodwoken = useLightGodwoken();
  const version = lightGodwoken?.getVersion();
  const pages: Record<GodwokenVersion, React.FC> = {
    v0: WithdrawalV0,
    v1: WithdrawalV1,
  };

  if (!version || !Object.values(GodwokenVersion).includes(version)) {
    return <Placeholder/>;
  }

  const Page = pages[version];
  return <Page />;
}
