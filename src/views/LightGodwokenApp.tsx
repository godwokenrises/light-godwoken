import RequestWithdrawal from "./RequestWithdrawal";
import Withdrawal from "./Withdrawal";
import Deposit from "./Deposit";
import { useState } from "react";
import { useLightGodwoken } from "../hooks/useLightGodwoken";
import WithdrawalV1 from "./WithdrawalV1";
import { LightGodwokenV1 } from "../light-godwoken";
import { addNetwork } from "../utils/addNetwork";
import { useChainId } from "../hooks/useChainId";

interface Props {
  activateView?: string;
}

export default function LightGodwokenApp(props: Props) {
  const [activeView, setActiveView] = useState(props.activateView || "withdrawal");
  const lightGodwoken = useLightGodwoken();
  const { data: chainId } = useChainId();
  if (lightGodwoken instanceof LightGodwokenV1 && chainId) {
    addNetwork(lightGodwoken.provider.ethereum, chainId);
  }

  const changeActiveView = (viewName: string) => {
    setActiveView(viewName);
  };
  const WithdrawalComp = lightGodwoken?.getVersion().toString() === "v0" ? Withdrawal : WithdrawalV1;

  return (
    {
      withdrawal: <WithdrawalComp onViewChange={changeActiveView}></WithdrawalComp>,
      deposit: <Deposit></Deposit>,
      "request-withdrawal": <RequestWithdrawal onViewChange={changeActiveView}></RequestWithdrawal>,
    }[activeView] || <Deposit></Deposit>
  );
}
