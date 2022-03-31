import RequestWithdrawal from "./RequestWithdrawal";
import Withdrawal from "./Withdrawal";
import Deposit from "./Deposit";
import { useState } from "react";

interface Props {
  activateView?: string;
}

export default function LightGodwokenApp(props: Props) {
  const [activeView, setActiveView] = useState(props.activateView || "withdrawal");

  const changeActiveView = (viewName: string) => {
    setActiveView(viewName);
  };

  return (
    {
      withdrawal: <Withdrawal onViewChange={changeActiveView}></Withdrawal>,
      deposit: <Deposit></Deposit>,
      "request-withdrawal": <RequestWithdrawal onViewChange={changeActiveView}></RequestWithdrawal>,
    }[activeView] || <Deposit></Deposit>
  );
}
