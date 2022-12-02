import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LightGodwokenV1 } from "light-godwoken";
import { AxiosError } from "axios";
import styled from "styled-components";
import Tooltip from "antd/lib/tooltip";
import QuestionCircleOutlined from "@ant-design/icons/lib/icons/QuestionCircleOutlined";
import { LinkList, Tab } from "../../style/common";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useInfiniteScroll } from "ahooks";
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
    return withdrawalList?.filter((history) => ["pending", "available"].includes(history.status)) || [];
  }, [withdrawalList]);
  const completedList = useMemo(() => {
    return withdrawalList?.filter((history) => history.status === "succeed") || [];
  }, [withdrawalList]);

  const displayLocalTxHistory = localTxHistory
    .filter((history) => history.status === "l2Pending")
    .map((history) => ({
      ...history,
      status: "l2Pending",
    }));

  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout>();
  const intervalReloadHistory = useCallback(() => {
    setRefreshTimer(
      setTimeout(() => {
        if (isPending) {
          reloadWithdrawalHistory();
          intervalReloadHistory();
        }
      }, 30000),
    );
  }, [isPending, reloadWithdrawalHistory]);
  useEffect(() => {
    if (refreshTimer) clearTimeout(refreshTimer);
    if (isPending) intervalReloadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, params.status]);

  if (!isPending && !isCompleted) {
    return <Navigate to={`/${params.version}/withdrawal/pending`} />;
  }
  if (!lightGodwoken || !withdrawalHistory.data?.initialized) {
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
          {pendingList.length + displayLocalTxHistory.length === 0 && <Empty>No pending withdrawals</Empty>}
          {displayLocalTxHistory.map((withdraw, index) => (
            <WithdrawalRequestCard {...withdraw} key={index}></WithdrawalRequestCard>
          ))}
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
      {isLoading && <Placeholder />}
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
