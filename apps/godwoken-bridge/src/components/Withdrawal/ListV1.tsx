import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LightGodwokenV1, ProxyERC20 } from "light-godwoken";
import { AxiosError } from "axios";
import styled from "styled-components";
import { LinkList, Tab } from "../../style/common";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useDebounceEffect, useDeepCompareEffect, useInfiniteScroll } from "ahooks";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { Placeholder } from "../Placeholder";
import { L1TxHistoryInterface } from "../../hooks/useL1TxHistory";
import WithdrawalRequestCard from "./WithdrawalItemV1";
import { Empty } from "../Container/Empty";

const WithdrawalListDiv = styled.div`
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;

  .list {
    max-height: 500px;
    min-height: 50px;
    overflow-y: auto;
  }
`;

interface WithdrawalHistoryType {
  remainingBlockNumber?: number;
  sudt_script_hash?: string;
  withdrawalBlockNumber?: number;
  status: string;
  layer1TxHash?: string;
  txHash: string;
  amount: string;
  capacity: string;
  erc20?: ProxyERC20;
}

interface Props {
  txHistory: L1TxHistoryInterface[];
  removeTxWithTxHashes: (txHash: string[]) => void;
}

export const WithdrawalList: React.FC<Props> = ({ txHistory: localTxHistory, removeTxWithTxHashes }) => {
  const params = useParams();
  const navigate = useNavigate();
  const isPending = params.status === "pending";
  const isCompleted = params.status === "completed";
  const lightGodwoken = useLightGodwoken();
  const [pendingHistory, setPendingHistory] = useState<WithdrawalHistoryType[] | undefined>(undefined);

  function navigateStatus(targetStatus: "pending" | "completed") {
    navigate(`/${params.version}/withdrawal/${targetStatus}`);
  }

  const listRef = useRef<HTMLDivElement>(null);
  const withdrawalHistory = useInfiniteScroll(
    async (data) => {
      const page = data?.page ? data.page + 1 : 1;
      const list = await getWithdrawalHistories(lightGodwoken as LightGodwokenV1, page);

      return {
        list,
        page,
        initialized: true,
        hasMore: list.length > 0,
      };
    },
    {
      manual: true,
      target: listRef,
      isNoMore: (data) => data?.hasMore === false,
    },
  );
  const reloadWithdrawalHistory = useCallback(() => {
    withdrawalHistory.mutate(void 0);
    withdrawalHistory.reload();
  }, [withdrawalHistory]);

  // When LightGodwoken client rebuilt, reload the list
  useEffect(() => {
    if (lightGodwoken && !withdrawalHistory.loading) {
      reloadWithdrawalHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightGodwoken]);

  const isLoading = withdrawalHistory.loading || withdrawalHistory.loadingMore;
  const withdrawalList = useMemo(() => {
    return withdrawalHistory?.data?.list || [];
  }, [withdrawalHistory]);
  const pendingList = useMemo(() => {
    return pendingHistory || [];
  }, [pendingHistory]);
  const hasL2Pending = useMemo(() => {
    return pendingList.filter((item) => item.status === "l2Pending").length > 0;
  }, [pendingList]);
  const completedList = useMemo(() => {
    return withdrawalList?.filter((history) => history.status === "succeed") || [];
  }, [withdrawalList]);

  const loadPendingHistory = useCallback(() => {
    if (localTxHistory.length === 0) {
      setPendingHistory([]);
      return;
    }
    getPendingHistoriesByRPC(lightGodwoken as LightGodwokenV1, localTxHistory).then((list) => setPendingHistory(list));
  }, [localTxHistory, lightGodwoken]);

  useDebounceEffect(() => loadPendingHistory(), [localTxHistory]);

  const removeLocalTxHistory = useCallback(() => {
    if (pendingList.length === 0) return;
    const removeHashes = [];
    for (const item of pendingList) {
      const index = completedList.findIndex(
        (_) => _.layer1TxHash === item.layer1TxHash && ["succeed", "failed"].includes(_.status),
      );
      if (index >= 0) {
        removeHashes.push(item.txHash);
      }
    }
    removeTxWithTxHashes(removeHashes);
  }, [completedList, pendingList, removeTxWithTxHashes]);

  useDebounceEffect(() => removeLocalTxHistory(), [withdrawalHistory]);

  const checkL2PendingTimer = useRef<NodeJS.Timeout>();
  useDeepCompareEffect(() => {
    if (checkL2PendingTimer.current) {
      clearTimeout(checkL2PendingTimer.current);
    }
    if (hasL2Pending) {
      loadPendingHistory();
      checkL2PendingTimer.current = setInterval(() => {
        loadPendingHistory();
      }, 15000);
    }
    return () => {
      if (checkL2PendingTimer.current) {
        clearTimeout(checkL2PendingTimer.current);
      }
    };
  }, [hasL2Pending]);

  const onPendingClick = useCallback(() => {
    if (isPending && pendingList.length > 0 && !hasL2Pending) {
      loadPendingHistory();
    }
  }, [isPending, pendingList, hasL2Pending, loadPendingHistory]);

  useDebounceEffect(() => onPendingClick(), [isPending]);

  const refreshTimer = useRef<NodeJS.Timeout>();
  const intervalReloadHistory = useCallback(() => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      if (!isPending) return;
    }
    refreshTimer.current = setTimeout(() => {
      if (isPending) {
        reloadWithdrawalHistory();
        intervalReloadHistory();
      }
    }, 65000);
  }, [isPending, reloadWithdrawalHistory]);
  useEffect(() => {
    intervalReloadHistory();
    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending]);

  if (!isPending && !isCompleted) {
    return <Navigate to={`/${params.version}/withdrawal/pending`} />;
  }
  if (!lightGodwoken || pendingHistory === undefined) {
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
          Pending
        </Tab>
        <Tab className={isCompleted ? "active" : ""} onClick={() => navigateStatus("completed")}>
          Completed
        </Tab>
      </LinkList>
      {isPending && (
        <div className="list pending-list">
          {pendingList.length === 0 && <Empty>No pending withdrawals</Empty>}
          {pendingList.map((withdraw, index) => (
            <WithdrawalRequestCard {...withdraw} key={index}></WithdrawalRequestCard>
          ))}
        </div>
      )}
      {isCompleted && (
        <div ref={listRef} className="list pending-list">
          {completedList.length === 0 && <Empty>No completed withdrawals</Empty>}
          {completedList.map((withdraw, index) => (
            <WithdrawalRequestCard {...withdraw} key={index}></WithdrawalRequestCard>
          ))}
        </div>
      )}
      {isCompleted && isLoading && <Placeholder />}
    </WithdrawalListDiv>
  );
};

async function getWithdrawalHistories(lightGodwoken: LightGodwokenV1, page: number) {
  try {
    return await lightGodwoken.getWithdrawalHistories(page);
  } catch (e) {
    if (e instanceof AxiosError) {
      const data = e.response?.data;
      const status = data?.errors?.status || data?.error_code;

      // 404 usually means we didn't find records of the account
      if (status && Number(status) === 404) {
        console.debug(
          "/api/withdrawal_histories 404: cannot find withdrawal history for",
          lightGodwoken.provider.getL2Address(),
        );
        return [];
      }
    }

    throw e;
  }
}

async function getPendingHistoriesByRPC(lightGodwoken: LightGodwokenV1, txHistory: L1TxHistoryInterface[]) {
  if (txHistory.length === 0) return [];
  const lastFinalizedBlockNumber = await lightGodwoken.provider.getLastFinalizedBlockNumber();
  const promises: any[] = [];
  for (const item of txHistory) {
    promises.push(
      new Promise(async (resolve) => {
        let data: WithdrawalHistoryType = {
          amount: item.amount,
          capacity: item.capacity,
          status: "l2Pending",
          txHash: item.txHash,
          erc20: item.token as ProxyERC20,
        };
        try {
          const result = (await lightGodwoken.getWithdrawal(item.txHash)) as any;
          const blockNumber = result?.l2_committed_info.block_number;
          if (blockNumber) {
            data = {
              ...data,
              status: result?.l1_committed_info?.transaction_hash ? "pending" : "l2Pending",
              remainingBlockNumber: blockNumber ? Math.max(0, blockNumber - lastFinalizedBlockNumber) : undefined,
              withdrawalBlockNumber: blockNumber,
              layer1TxHash: result?.l1_committed_info?.transaction_hash,
              sudt_script_hash: result?.withdrawal?.request?.raw?.sudt_script_hash,
            };
          }
          resolve(data);
        } catch (_) {
          resolve(data);
        }
      }),
    );
  }
  return await Promise.all(promises);
}
