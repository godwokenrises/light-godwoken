import React, { useState } from "react";
import { useClock } from "../../hooks/useClock";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { useQuery } from "react-query";
import styled from "styled-components";
import WithdrawalRequestCard from "./WithdrawalRequestCard";
import { Cell } from "@ckb-lumos/base";
import { Placeholder } from "../Placeholder";
import { useChainId } from "../../hooks/useChainId";
import { useL1TxHistory } from "../../hooks/useL1TxHistory";
import { LinkList, Tab } from "../../style/common";

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
  unlockButton?: (cell: Cell) => JSX.Element;
}
export const WithdrawalList: React.FC<Props> = ({ unlockButton }: Props) => {
  const lightGodwoken = useLightGodwoken();
  const l1Address = lightGodwoken?.provider.getL1Address();
  const { data: chainId } = useChainId();
  const historyKey = `${chainId}/${l1Address}/withdrawal`;
  const { txHistory, updateTxHistory, addTxToHistory } = useL1TxHistory(historyKey);
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
      return lightGodwoken?.listWithdraw();
    },
    {
      enabled: !!lightGodwoken,
    },
  );
  const { data: withdrawalList, isLoading } = withdrawalListQuery;
  withdrawalList?.forEach((withdraw) => {
    if (!txHistory.find((history) => withdraw.cell.out_point?.tx_hash === history.txHash)) {
      addTxToHistory({
        type: "withdrawal",
        txHash: withdraw.cell.out_point?.tx_hash || "",
        capacity: withdraw.capacity,
        amount: withdraw.amount,
        token: withdraw.erc20,
        status: "pending",
      });
    }
  });
  const formattedHistoryList = txHistory.map((history) => {
    const targetWithdraw = withdrawalList?.find((withdraw) => withdraw.cell.out_point?.tx_hash === history.txHash);
    if (targetWithdraw) {
      return {
        ...history,
        cell: targetWithdraw.cell,
        remainingBlockNumber: targetWithdraw.remainingBlockNumber,
      };
    }
    return history;
  });
  const pendingList = formattedHistoryList.filter((history) => history.status === "pending");
  const completedList = formattedHistoryList.filter((history) => history.status !== "pending");

  const subscribePayload = pendingList.map((history) => history.txHash);
  const eventEmit = lightGodwoken?.subscribPendingWithdrawalTransactions(subscribePayload);

  eventEmit?.on("success", (txHash) => {
    updateTxStatus(txHash, "success");
  });
  eventEmit?.on("error", (txHash) => {
    updateTxStatus(txHash, "error");
  });
  eventEmit?.on("pending", (txHash) => {
    updateTxStatus(txHash, "pending");
  });
  const updateTxStatus = (txHash: string, status: string) => {
    const result = txHistory.find((tx) => {
      return tx.txHash === txHash;
    });
    if (result) {
      result.status = status;
      updateTxHistory(result);
    }
  };

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
            <WithdrawalRequestCard
              now={now}
              {...withdraw}
              key={index}
              unlockButton={unlockButton}
            ></WithdrawalRequestCard>
          ))}
        </div>
      )}
      {active !== "pending" && (
        <div className="list pending-list">
          {completedList.length === 0 && "There is no completed withdrawal request here"}
          {completedList.map((withdraw, index) => (
            <WithdrawalRequestCard
              now={now}
              {...withdraw}
              key={index}
              unlockButton={unlockButton}
            ></WithdrawalRequestCard>
          ))}
        </div>
      )}
      {isLoading && <Placeholder />}
    </WithdrawalListDiv>
  );
};
