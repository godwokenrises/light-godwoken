import React, { useState } from "react";
import styled from "styled-components";
import DepositItem from "./DepositItem";
import { Placeholder } from "../Placeholder";
import { LinkList, Tab } from "../../style/common";
import { DepositHistoryType } from "../../hooks/useDepositTxHistory";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { format } from "date-fns";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { utils } from "@ckb-lumos/lumos";

const DepositListDiv = styled.div`
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  .list {
    max-height: 500px;
    min-height: 50px;
    overflow-y: auto;
  }
`;

export interface DepositListParams {
  depositHistory: DepositHistoryType[];
  isLoading: boolean;
}

export const DepositList: React.FC<DepositListParams> = ({ depositHistory, isLoading }) => {
  const lightGodwoken = useLightGodwoken();
  const cancelTimeout = lightGodwoken?.getCancelTimeout() || 0;

  const [page] = useState(1);
  const depositHistoryQuery = useQuery(
    [
      "queryDepositHistoryList",
      {
        version: lightGodwoken?.getVersion(),
        l2Address: lightGodwoken?.provider.getL2Address(),
      },
    ],
    async () => {
      const list = await lightGodwoken!.getDepositHistories(page);
      return list.map((deposit): DepositHistoryType => {
        const date = format(new Date(deposit.history.timestamp), "yyyy-MM-dd HH:mm:ss");
        const sudtAmount = deposit.sudt ? utils.readBigUInt128LECompatible(deposit.cell.data).toHexString() : "0x0";

        return {
          txHash: deposit.history.layer1_tx_hash || "",
          capacity: deposit.history.capacity,
          status: deposit.status,
          token: deposit.sudt,
          amount: sudtAmount,
          cancelTimeout,
          date,
        };
      });
    },
    {
      keepPreviousData: true,
      enabled: !!lightGodwoken,
    },
  );

  const { data: depositScanHistory, isLoading: isDepositScanHistoryLoading } = depositHistoryQuery;
  const depositScanHistoryTxHashes = depositScanHistory?.map((history) => history.txHash) ?? [];
  const isListLoading = isLoading || isDepositScanHistoryLoading;

  const params = useParams();
  const navigate = useNavigate();
  const isPending = params.status === "pending";
  const isCompleted = params.status === "completed";
  if (!isPending && !isCompleted) {
    return <Navigate to={`/${params.version}/deposit/pending`} />;
  }

  const pendingList = depositHistory.filter((history) => history.status === "pending");
  const completedList = depositHistory.filter((history) => {
    return history.status !== "pending" && !depositScanHistoryTxHashes.includes(history.txHash);
  });
  function navigateStatus(targetStatus: "pending" | "completed") {
    navigate(`/${params.version}/deposit/${targetStatus}`);
  }

  if (!completedList.length && !depositScanHistory?.length) {
    return (
      <DepositListDiv>
        <Placeholder />
      </DepositListDiv>
    );
  }

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
          {!completedList.length && !depositScanHistory?.length && "There is no completed deposit request here"}
          {completedList.map((deposit, index) => (
            <DepositItem {...deposit} key={index}></DepositItem>
          ))}
          {depositScanHistory?.map((deposit, index) => (
            <DepositItem {...deposit} key={index}></DepositItem>
          ))}
        </div>
      )}
      {isListLoading && <Placeholder />}
    </DepositListDiv>
  );
};
