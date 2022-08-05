import React from "react";
import WithdrawalV0 from "./WithdrawalV0";
import WithdrawalV1 from "./WithdrawalV1";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { GodwokenVersion } from "light-godwoken";

export default function Withdrawal() {
  const lightGodwoken = useLightGodwoken();
  const version = lightGodwoken?.getVersion();
  const pages: Record<GodwokenVersion, React.FC> = {
    v0: WithdrawalV0,
    v1: WithdrawalV1,
  };

  const Page = version ? pages[version] : pages.v1;
  return <Page />;
}
