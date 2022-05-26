import React, { useState } from "react";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { useQuery } from "react-query";
import styled from "styled-components";
import DepositItem from "./DepositItem";
import { Placeholder } from "../Placeholder";
import { useChainId } from "../../hooks/useChainId";
import { useL1TxHistory } from "../../hooks/useL1TxHistory";
import { BI } from "@ckb-lumos/bi";
import EventEmitter from "events";

const DepositListDiv = styled.div`
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  .list {
    max-height: 500px;
    min-height: 50px;
    overflow-y: auto;
  }
  .link-list {
    display: flex;
    justify-content: center;
    padding-bottom: 20px;
  }
`;

const Tab = styled.span`
  height: 32px;
  line-height: 32px;
  width: 120px;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  color: black;
  border-radius: 8px;
  @media (max-width: 600px) {
    width: 100px;
    .right-side {
      display: none;
    }
  }
  &.active {
    background: #18efb1;
  }
  &:hover {
    cursor: pointer;
  }
`;
export const DepositList: React.FC = () => {
  const lightGodwoken = useLightGodwoken();
  const l1Address = lightGodwoken?.provider.getL1Address();
  const { data: chainId } = useChainId();
  const historyKey = `${chainId}/${l1Address}/deposit`;
  const { txHistory, updateTxHistory } = useL1TxHistory(historyKey);
  const [active, setActive] = useState("padding");
  const changeViewToPadding = () => {
    setActive("padding");
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

  const { data: depositList } = depositListQuery;
  const formattedTxHistory = txHistory.map((history) => {
    const targetDeposit = depositList?.find((deposit) => deposit.rawCell.out_point?.tx_hash === history.txHash);
    return {
      capacity: BI.from(history.capacity),
      amount: BI.from(history.amount),
      sudt: history.sudt,
      txHash: history.txHash,
      status: history.status || "pending",
      rawCell: targetDeposit?.rawCell,
      cancelTime: targetDeposit?.cancelTime,
    };
  });
  depositList?.forEach((deposit) => {
    if (!formattedTxHistory.find((txHistory) => deposit.rawCell.out_point?.tx_hash === txHistory.txHash)) {
      formattedTxHistory.push({
        capacity: deposit.capacity,
        amount: deposit.amount,
        sudt: deposit.sudt,
        txHash: deposit.rawCell.out_point?.tx_hash || "",
        rawCell: deposit.rawCell,
        cancelTime: deposit.cancelTime,
        status: "pending",
      });
    }
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
  const subscribPayload = formattedTxHistory.map(({ txHash }) => txHash);
  const eventEmit = lightGodwoken?.subscribPendingDepositTransactions(subscribPayload);
  eventEmit?.on("success", (txHash) => {
    updateTxStatus(txHash, "success");
  });
  eventEmit?.on("error", (txHash) => {
    updateTxStatus(txHash, "error");
  });
  eventEmit?.on("pending", (txHash) => {
    updateTxStatus(txHash, "pending");
  });

  if (!depositList) {
    return (
      <DepositListDiv>
        <Placeholder />
      </DepositListDiv>
    );
  }
  return (
    <DepositListDiv>
      <div className="link-list">
        <Tab onClick={changeViewToPadding} className={active === "padding" ? "active" : ""}>
          Padding
        </Tab>
        <Tab onClick={changeViewToCompleted} className={active === "completed" ? "active" : ""}>
          Completed
        </Tab>
      </div>
      {active === "padding" && (
        <div className="list padding-list">
          {formattedTxHistory.length === 0 && "There is no pending deposit request here"}
          {formattedTxHistory.map((deposit, index) => {
            if (deposit.status !== "pending") return null;
            return <DepositItem {...deposit} key={index}></DepositItem>;
          })}
        </div>
      )}
      {active === "completed" && (
        <div className="list completed-list">
          {formattedTxHistory.length === 0 && "There is no completed deposit request here"}
          {formattedTxHistory.map((deposit, index) => {
            if (deposit.status === "pending") return null;
            return <DepositItem {...deposit} key={index}></DepositItem>;
          })}
        </div>
      )}
    </DepositListDiv>
  );
};
