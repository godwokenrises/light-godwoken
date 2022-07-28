import React from 'react';
import styled from "styled-components";
import DepositItem from "./DepositItem";
import { Placeholder } from "../Placeholder";
import { LinkList, Tab } from "../../style/common";
import { DepositHistoryType } from "../../hooks/useDepositTxHistory";
import { Navigate, useNavigate, useParams } from "react-router-dom";

const DepositListDiv = styled.div`
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  .list {
    max-height: 500px;
    min-height: 50px;
    overflow-y: auto;
  }
`;

export const DepositList: React.FC<{ depositHistory: DepositHistoryType[]; isLoading: boolean }> = ({
  depositHistory,
  isLoading,
}) => {
  const params = useParams();
  const navigate = useNavigate();
  const isPending = params.status === "pending";
  const isCompleted = params.status === "completed";
  function navigateStatus(targetStatus: "pending" | "completed") {
    navigate(`/${params.version}/deposit/${targetStatus}`);
  }

  if (!isPending && !isCompleted) {
    return <Navigate to={`/${params.version}/deposit/pending`} />;
  }

  const pendingList = depositHistory.filter((history) => history.status === "pending");
  const completedList = depositHistory.filter((history) => history.status !== "pending");

  return (
    <DepositListDiv>
      <LinkList>
        <Tab className={isPending ? "active" : ""} onClick={() => navigateStatus("pending")}>
          Pending
        </Tab>
        <Tab className={isCompleted ? "active" : ""} onClick={() => navigateStatus("completed")}>
          Completed
        </Tab>
      </LinkList>
      {isPending && (
        <div className="list pending-list">
          {pendingList.length === 0 && "There is no pending deposit request here"}
          {pendingList.map((deposit, index) => (
            <DepositItem {...deposit} key={index}></DepositItem>
          ))}
        </div>
      )}
      {isCompleted && (
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
