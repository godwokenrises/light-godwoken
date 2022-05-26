import React, { useState } from "react";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { useQuery } from "react-query";
import styled from "styled-components";
import DepositItem from "./DepositItem";
import { Placeholder } from "../Placeholder";
import { useChainId } from "../../hooks/useChainId";
import { useL1TxHistory } from "../../hooks/useL1TxHistory";
import { BI } from "@ckb-lumos/bi";
import { LinkList, Tab } from "../../style/common";

const DepositListDiv = styled.div`
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  .list {
    max-height: 500px;
    min-height: 50px;
    overflow-y: auto;
  }
`;
export const DepositList: React.FC = () => {
  const lightGodwoken = useLightGodwoken();
  const l1Address = lightGodwoken?.provider.getL1Address();
  const { data: chainId } = useChainId();
  const historyKey = `${chainId}/${l1Address}/deposit`;
  const { txHistory, updateTxHistory, addTxToHistory } = useL1TxHistory(historyKey);
  const [active, setActive] = useState("pending");
  const changeViewToPending = () => {
    setActive("pending");
  };
  const changeViewToCompleted = () => {
    setActive("completed");
  };
  const depositListQuery = useQuery(
    ["queryDepositList", { version: lightGodwoken?.getVersion(), l2Address: lightGodwoken?.provider.getL2Address() }],
    () => {
      return lightGodwoken?.getDepositList();
    },
    {
      enabled: !!lightGodwoken,
    },
  );

  const { data: depositList, isLoading } = depositListQuery;

  depositList?.forEach((deposit) => {
    if (!formattedTxHistory.find((txHistory) => deposit.rawCell.out_point?.tx_hash === txHistory.txHash)) {
      addTxToHistory({
        type: "deposit",
        capacity: deposit.capacity.toHexString(),
        amount: deposit.amount.toHexString(),
        token: deposit.sudt,
        txHash: deposit.rawCell.out_point?.tx_hash || "",
        status: "pending",
      });
    }
  });

  const formattedTxHistory = txHistory.map((history) => {
    const targetDeposit = depositList?.find((deposit) => deposit.rawCell.out_point?.tx_hash === history.txHash);
    return {
      capacity: BI.from(history.capacity),
      amount: BI.from(history.amount),
      token: history.token,
      txHash: history.txHash,
      status: history.status || "pending",
      rawCell: targetDeposit?.rawCell,
      cancelTime: targetDeposit?.cancelTime,
    };
  });

  const pendingList = formattedTxHistory.filter((history) => history.status === "pending");
  const completedList = formattedTxHistory.filter((history) => history.status !== "pending");

  const updateTxStatus = (txHash: string, status: string) => {
    const result = txHistory.find((tx) => {
      return tx.txHash === txHash;
    });
    if (result) {
      result.status = status;
      updateTxHistory(result);
    }
  };
  const subscribePayload = pendingList.map(({ txHash }) => txHash);
  const eventEmit = lightGodwoken?.subscribPendingDepositTransactions(subscribePayload);
  eventEmit?.on("success", (txHash) => {
    updateTxStatus(txHash, "success");
  });
  eventEmit?.on("error", (txHash) => {
    updateTxStatus(txHash, "error");
  });
  eventEmit?.on("pending", (txHash) => {
    updateTxStatus(txHash, "pending");
  });

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
