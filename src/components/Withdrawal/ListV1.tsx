import React from "react";
import styled from "styled-components";
import Tooltip from "antd/lib/tooltip";
import QuestionCircleOutlined from "@ant-design/icons/lib/icons/QuestionCircleOutlined";
import { LinkList, Tab } from "../../style/common";
import { useQuery } from "react-query";
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { Placeholder } from "../Placeholder";
import WithdrawalRequestCard from "./WithdrawalItemV1";
import LightGodwokenV1 from "../../light-godwoken/LightGodwokenV1";
import { L1TxHistoryInterface } from "../../hooks/useL1TxHistory";

const WithdrawalListDiv = styled.div`
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  .list {
    max-height: 500px;
    min-height: 50px;
    overflow-y: auto;
  }
`;

interface Props {
  txHistory: L1TxHistoryInterface[];
  updateTxWithStatus: (txHash: string, status: string) => void;
}

export const WithdrawalList: React.FC<Props> = ({ txHistory: localTxHistory }) => {
  const params = useParams();
  const navigate = useNavigate();
  const isPending = params.status === "pending";
  const isCompleted = params.status === "completed";
  function navigateStatus(targetStatus: "pending" | "completed") {
    navigate(`/${params.version}/withdrawal/${targetStatus}`);
  }

  const lightGodwoken = useLightGodwoken();
  const withdrawalListQuery = useQuery(
    ["queryWithdrawList", { version: lightGodwoken?.getVersion(), l2Address: lightGodwoken?.provider.getL2Address() }],
    () => {
      return (lightGodwoken as LightGodwokenV1).listWithdrawWithScannerApi();
    },
    {
      enabled: !!lightGodwoken,
    },
  );
  const { data: withdrawalList, isLoading } = withdrawalListQuery;

  const pendingList = withdrawalList?.filter((history) => history.status === "pending") || [];
  const completedList = withdrawalList?.filter((history) => history.status !== "pending") || [];
  console.log("withdrawalList v1 in local storage", localTxHistory);
  const displayLocalTxHistory = localTxHistory
    .filter((history) => history.status === "l2Pending")
    .map((history) => {
      return {
        ...history,
        status: "l2Pending",
      };
    });

  if (!lightGodwoken) {
    return <WithdrawalListDiv>please connect wallet first</WithdrawalListDiv>;
  }
  if (!isPending && !isCompleted) {
    return <Navigate to={`/${params.version}/withdrawal/pending`} />;
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
        <Tab className={isPending ? "active" : ""} onClick={() => navigateStatus("pending")}>
          <Tooltip title="After a successful withdrawal transaction is sent, it usually comes up in the pending list within five minutes.">
            Pending
            <QuestionCircleOutlined style={{ marginLeft: 8, color: "#000000", height: "21px", lineHeight: "21px" }} />
          </Tooltip>
        </Tab>
        <Tab className={isCompleted ? "active" : ""} onClick={() => navigateStatus("completed")}>
          Completed
        </Tab>
      </LinkList>
      {isPending && (
        <div className="list pending-list">
          {pendingList.length + displayLocalTxHistory.length === 0 && "There is no pending withdrawal request here"}
          {displayLocalTxHistory.map((withdraw, index) => (
            <WithdrawalRequestCard {...withdraw} key={index}></WithdrawalRequestCard>
          ))}
          {pendingList.map((withdraw, index) => (
            <WithdrawalRequestCard {...withdraw} key={index}></WithdrawalRequestCard>
          ))}
        </div>
      )}
      {isCompleted && (
        <div className="list pending-list">
          {completedList.length === 0 && "There is no completed withdrawal request here"}
          {completedList.map((withdraw, index) => (
            <WithdrawalRequestCard {...withdraw} key={index}></WithdrawalRequestCard>
          ))}
        </div>
      )}
      {isLoading && <Placeholder />}
    </WithdrawalListDiv>
  );
};
