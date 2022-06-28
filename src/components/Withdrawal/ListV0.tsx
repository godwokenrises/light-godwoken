import React, { useState } from "react";
import { useClock } from "../../hooks/useClock";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { useQuery } from "react-query";
import styled from "styled-components";
import WithdrawalRequestCard from "./WithdrawalItemV0";
import { Placeholder } from "../Placeholder";
import { LinkList, Tab } from "../../style/common";
import { LightGodwokenV0 } from "../../light-godwoken";

const WithdrawalListDiv = styled.div`
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  .list {
    max-height: 500px;
    min-height: 50px;
    overflow-y: auto;
  }
`;
export const WithdrawalList: React.FC = () => {
  const lightGodwoken = useLightGodwoken();

  const now = useClock();
  const [active, setActive] = useState("pending");
  const changeViewToPending = () => {
    setActive("pending");
  };
  const changeViewToCompleted = () => {
    setActive("completed");
  };
  const withdrawalListQuery = useQuery(
    ["queryWithdrawList", { version: lightGodwoken?.getVersion(), l2Address: lightGodwoken?.provider.getL2Address() }],
    () => {
      return (lightGodwoken as LightGodwokenV0).listWithdrawWithScannerApi();
    },
    {
      enabled: !!lightGodwoken,
    },
  );
  const { data: withdrawalList, isLoading } = withdrawalListQuery;

  const formattedWithdrawalList = withdrawalList || [];

  const pendingList = formattedWithdrawalList.filter((history) => history.status === "pending");
  const completedList = formattedWithdrawalList.filter(
    (history) => history.status === "success" || history.status === "failed",
  );

  if (!lightGodwoken) {
    return <WithdrawalListDiv>please connect wallet first</WithdrawalListDiv>;
  }
  if (!withdrawalList) {
    return (
      <WithdrawalListDiv>
        <Placeholder />
      </WithdrawalListDiv>
    );
  }
  return (
    <WithdrawalListDiv>
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
          {pendingList.length === 0 && "There is no pending withdrawal request here"}
          {pendingList.map((withdraw, index) => (
            <WithdrawalRequestCard now={now} {...withdraw} key={index}></WithdrawalRequestCard>
          ))}
        </div>
      )}
      {active !== "pending" && (
        <div className="list pending-list">
          {completedList.length === 0 && "There is no completed withdrawal request here"}
          {completedList.map((withdraw: any, index: number) => (
            <WithdrawalRequestCard now={now} {...withdraw} key={index}></WithdrawalRequestCard>
          ))}
        </div>
      )}
      {isLoading && <Placeholder />}
    </WithdrawalListDiv>
  );
};
