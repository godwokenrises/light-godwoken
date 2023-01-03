import styled from "styled-components";
import React, { useEffect, useRef } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { number } from "@ckb-lumos/codec";
import { useInfiniteScroll } from "ahooks";
import { format } from "date-fns";
import { AxiosError } from "axios";
import { LightGodwoken } from "light-godwoken";
import DepositItem from "./DepositItem";
import { Placeholder } from "../Placeholder";
import { LinkList, Tab } from "../../style/common";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { DepositHistoryType } from "../../hooks/useDepositTxHistory";
import { Empty } from "../Container/Empty";

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
  depositList: DepositHistoryType[];
  isLoading: boolean;
}

export const DepositList: React.FC<DepositListParams> = ({ depositList, isLoading }) => {
  const lightGodwoken = useLightGodwoken();
  const cancelTimeout = lightGodwoken?.getCancelTimeout() || 0;

  const listRef = useRef<HTMLDivElement>(null);
  const depositHistory = useInfiniteScroll(
    async (data) => {
      const page = data?.page ? data.page + 1 : 1;
      const history = await getDepositHistories(lightGodwoken!, page);
      const list = history.map((deposit): DepositHistoryType => {
        const date = format(new Date(deposit.history.timestamp), "yyyy-MM-dd HH:mm:ss");
        const sudtAmount = deposit.sudt ? number.Uint128LE.unpack(deposit.cell.data).toHexString() : "0x0";

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

      return {
        list,
        page,
        initialized: true,
        hasMore: history.length > 0,
      };
    },
    {
      manual: true,
      target: listRef,
      isNoMore: (data) => data?.hasMore === false,
    },
  );

  useEffect(() => {
    if (lightGodwoken && !depositHistory.loading) {
      depositHistory.mutate(void 0);
      depositHistory.reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightGodwoken]);

  const depositHistoryList = depositHistory.data?.list ?? [];
  const depositHistoryTxHashes = depositHistoryList.map((history) => history.txHash);
  const isListLoading = isLoading || depositHistory.loading || depositHistory.loadingMore;

  const params = useParams();
  const navigate = useNavigate();
  const isPending = params.status === "pending";
  const isCompleted = params.status === "completed";
  if (!isPending && !isCompleted) {
    return <Navigate to={`/${params.version}/deposit/pending`} />;
  }

  const pendingList = depositList.filter((history) => history.status === "pending");
  const completedList = depositList.filter((history) => {
    return history.status !== "pending" && !depositHistoryTxHashes.includes(history.txHash);
  });
  function navigateStatus(targetStatus: "pending" | "completed") {
    navigate(`/${params.version}/deposit/${targetStatus}`);
  }

  if (!lightGodwoken || !depositHistory.data?.initialized) {
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
          {pendingList.length === 0 && <Empty>No pending deposits</Empty>}
          {pendingList.map((deposit, index) => (
            <DepositItem {...deposit} key={index}></DepositItem>
          ))}
        </div>
      )}
      {isCompleted && (
        <div ref={listRef} className="list completed-list">
          {!completedList.length && !depositHistoryList.length && <Empty>No completed deposits</Empty>}
          {completedList.map((deposit, index) => (
            <DepositItem {...deposit} key={index}></DepositItem>
          ))}
          {depositHistoryList.map((deposit, index) => (
            <DepositItem {...deposit} key={index}></DepositItem>
          ))}
        </div>
      )}
      {isListLoading && <Placeholder />}
    </DepositListDiv>
  );
};

async function getDepositHistories(lightGodwoken: LightGodwoken, page: number) {
  try {
    return await lightGodwoken.getDepositHistories(page);
  } catch (e) {
    if (e instanceof AxiosError) {
      const data = e.response?.data;
      const status = data?.errors?.status || data?.error_code;

      // 404 usually means we didn't find records of the account
      if (status && Number(status) === 404) {
        console.debug(
          "/api/deposit_histories 404: cannot find deposit history for",
          lightGodwoken.provider.getL2Address(),
        );
        return [];
      }
    }

    throw e;
  }
}
