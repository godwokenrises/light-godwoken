import styled from "styled-components";
import { LinkList, Tab } from "../../style/common";
import React, { useEffect, useMemo, useState } from "react";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useGodwokenVersion } from "../../hooks/useGodwokenVersion";
import { useL1TxHistory } from "../../hooks/useL1TxHistory";
import { Placeholder } from "../Placeholder";
import L1TransferItem from "./L1TransferItem";
import { L1TransactionEventEmitter, L1TransactionRejectedError, LightGodwokenError } from "light-godwoken";
import { Empty } from "../Container/Empty";

const L1TransferListStyleWrapper = styled.div`
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  .list {
    max-height: 500px;
    min-height: 50px;
    overflow-y: auto;
  }
`;

export default function L1TransferList() {
  const lightGodwoken = useLightGodwoken();
  const godwokenVersion = useGodwokenVersion();
  const l1Address = lightGodwoken?.provider.getL1Address();

  // tx history
  const storeKey = `${godwokenVersion}/${l1Address}/transfer`;
  const { txHistory, updateTxWithStatus, removeTxWithTxHashes } = useL1TxHistory(storeKey);

  // route
  const params = useParams();
  const navigate = useNavigate();
  const isPending = params.status === "pending";
  const isCompleted = params.status === "completed";
  function navigateStatus(targetStatus: "pending" | "completed") {
    navigate(`/${params.version}/transfer/${targetStatus}`);
  }

  const pendingList = useMemo(() => txHistory.filter((row) => row.status === "pending"), [txHistory]);
  const completedList = useMemo(() => txHistory.filter((row) => row.status !== "pending"), [txHistory]);
  const pendingTxHashes = useMemo(() => pendingList.map((row) => row.txHash), [pendingList]);
  const completedTxHashes = useMemo(() => completedList.map((row) => row.txHash), [completedList]);

  useEffect(() => {
    if (completedTxHashes.length > 15) {
      const oldTxHashes = completedTxHashes.slice(15);
      removeTxWithTxHashes(oldTxHashes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedTxHashes]);

  const [pendingListener, setPendingListener] = useState<L1TransactionEventEmitter>();
  useEffect(
    () => {
      if (!lightGodwoken) return;
      if (!pendingTxHashes.length) return;

      const listener = lightGodwoken!.subscribePendingL1Transactions(pendingTxHashes);
      listener.on("success", (txHash) => {
        updateTxWithStatus(txHash, "success");
      });
      listener.on("fail", (e) => {
        if (e instanceof L1TransactionRejectedError) {
          updateTxWithStatus(e.metadata, "rejected");
        } else if (e instanceof LightGodwokenError) {
          console.error(`L1 transaction "${e.metadata}" failed with:`, e);
        } else {
          console.error("L1 transaction failed with unknown error:", e);
        }
      });

      setPendingListener(listener);
      return () => {
        pendingListener?.removeAllListeners?.();
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lightGodwoken, godwokenVersion, pendingTxHashes],
  );

  if (!isPending && !isCompleted) {
    return <Navigate to={`/${params.version}/transfer/pending`} />;
  }
  if (!lightGodwoken) {
    return (
      <L1TransferListStyleWrapper>
        <Placeholder />
      </L1TransferListStyleWrapper>
    );
  }

  return (
    <L1TransferListStyleWrapper>
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
          {pendingList.length === 0 && <Empty>No pending transfers</Empty>}
          {pendingList.map((props, index) => (
            <L1TransferItem {...props} key={index} />
          ))}
        </div>
      )}
      {isCompleted && (
        <div className="list completed-list">
          {completedList.length === 0 && <Empty>No completed transfers</Empty>}
          {completedList.map((props, index) => (
            <L1TransferItem {...props} key={index} />
          ))}
        </div>
      )}
    </L1TransferListStyleWrapper>
  );
}
