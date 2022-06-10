import React, { useState } from "react";
import styled from "styled-components";
import DepositItem from "./DepositItem";
import { Placeholder } from "../Placeholder";
import { BI } from "@ckb-lumos/bi";
import { LinkList, Tab } from "../../style/common";
import { Token } from "../../light-godwoken/lightGodwokenType";
import { Cell } from "@ckb-lumos/base";

const DepositListDiv = styled.div`
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  .list {
    max-height: 500px;
    min-height: 50px;
    overflow-y: auto;
  }
`;

type TxHistoryType = {
  capacity: BI;
  amount: BI;
  token: Token | undefined;
  txHash: string;
  status: string;
  rawCell: Cell | undefined;
  cancelTime: BI | undefined;
};

export const DepositList: React.FC<{ formattedTxHistory: TxHistoryType[]; isLoading: boolean }> = ({
  formattedTxHistory,
  isLoading,
}) => {
  const [active, setActive] = useState("pending");
  const changeViewToPending = () => {
    setActive("pending");
  };
  const changeViewToCompleted = () => {
    setActive("completed");
  };

  const pendingList = formattedTxHistory.filter((history) => history.status === "pending");
  const completedList = formattedTxHistory.filter(
    (history) => history.status === "success" || history.status === "fail",
  );

  return (
    <DepositListDiv>
      <LinkList>
        <Tab onClick={changeViewToPending} className={active === "pending" ? "active" : ""}>
          Pending
        </Tab>
        <Tab onClick={changeViewToCompleted} className={active === "completed" ? "active" : ""}>
          Completed
        </Tab>
      </LinkList>
      {active === "pending" && (
        <div className="list pending-list">
          {pendingList.length === 0 && "There is no pending deposit request here"}
          {pendingList.map((deposit, index) => (
            <DepositItem {...deposit} key={index}></DepositItem>
          ))}
        </div>
      )}
      {active === "completed" && (
        <div className="list completed-list">
          {completedList.length === 0 && "There is no completed deposit request here"}
          {completedList.map((deposit, index) => (
            <DepositItem {...deposit} key={index}></DepositItem>
          ))}
        </div>
      )}
      {isLoading && <Placeholder />}
    </DepositListDiv>
  );
};
