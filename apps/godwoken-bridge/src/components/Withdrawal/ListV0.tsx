import React, { useEffect, useMemo, useRef } from "react";
import styled from "styled-components";
import Tooltip from "antd/lib/tooltip";
import QuestionCircleOutlined from "@ant-design/icons/lib/icons/QuestionCircleOutlined";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { LightGodwokenV0 } from "light-godwoken";
import { useInfiniteScroll } from "ahooks";
import { providers } from "ethers";
import { LinkList, Tab } from "../../style/common";
import { useClock } from "../../hooks/useClock";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { Placeholder } from "../Placeholder";
import WithdrawalRequestCard from "./WithdrawalItemV0";
import { createLightGodwokenV1 } from "../../utils/lightGodwoken";
import { useGodwokenVersion } from "../../hooks/useGodwokenVersion";
import { useL1UnlockHistory } from "../../hooks/useL1UnlockHistory";

const WithdrawalListDiv = styled.div`
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  .list {
    max-height: 500px;
    min-height: 50px;
    overflow-y: auto;
  }
`;
export const WithdrawalList: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const isPending = params.status === "pending";
  const isCompleted = params.status === "completed";
  function navigateStatus(targetStatus: "pending" | "completed") {
    navigate(`/${params.version}/withdrawal/${targetStatus}`);
  }

  const now = useClock();
  const lightGodwoken = useLightGodwoken();
  const lightGodwokenV1 = createLightGodwokenV1(
    lightGodwoken!.provider.getL2Address(),
    lightGodwoken!.provider.getNetwork(),
    (lightGodwoken!.provider.ethereum.provider as providers.Web3Provider).provider,
  );

  const listRef = useRef<HTMLDivElement>(null);
  const withdrawalHistory = useInfiniteScroll(
    async (data) => {
      const normalPage = data?.normalpage ? (data?.normalHasMore ? data?.normalpage + 1 : data?.normalPage) : 1;
      const fastPage = data?.fastPage ? (data?.fastHasMore ? data?.fastPage + 1 : data?.fastPage) : 1;

      const [normalList, fastList] = await Promise.all([
        (() => {
          if (data?.normalHasMore || normalPage === 1) {
            return (lightGodwoken as LightGodwokenV0).getWithdrawalHistories(normalPage);
          } else {
            return [];
          }
        })(),
        (() => {
          if (data?.fastPage || fastPage === 1) {
            return (lightGodwoken as LightGodwokenV0).getFastWithdrawalHistories(lightGodwokenV1, fastPage);
          } else {
            return [];
          }
        })(),
      ]);
      const normalHasMore = normalList.length > 0;
      const fastHasMore = fastList.length > 0;

      return {
        initialized: true,
        list: [...normalList, ...fastList],
        normalPage,
        normalHasMore,
        fastPage,
        fastHasMore,
        hasMore: normalHasMore || fastHasMore,
      };
    },
    {
      manual: true,
      target: listRef,
      isNoMore: (data) => data?.hasMore === false,
    },
  );

  // When LightGodwoken client rebuild, reset pagination
  useEffect(() => {
    if (lightGodwoken && !withdrawalHistory.loading) {
      withdrawalHistory.mutate(void 0);
      withdrawalHistory.reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightGodwoken]);

  const isLoading = withdrawalHistory.loading || withdrawalHistory.loadingMore;
  const withdrawalList = useMemo(() => {
    const list = withdrawalHistory.data?.list ?? [];
    if (list.length) {
      list.sort((a, b) => {
        return b.withdrawalBlockNumber - a.withdrawalBlockNumber;
      });
    }
    return list;
  }, [withdrawalHistory.data?.list]);
  const pendingList = useMemo(() => {
    return withdrawalList.filter((history) => ["pending", "available"].includes(history.status));
  }, [withdrawalList]);
  const completedList = useMemo(() => {
    return withdrawalList.filter((history) => !["pending", "available"].includes(history.status));
  }, [withdrawalList]);
  const completedLayer1TxHashList = useMemo(() => {
    return completedList.map((history) => history.layer1TxHash);
  }, [completedList]);

  const godwokenVersion = useGodwokenVersion();
  const l1Address = useMemo(() => lightGodwoken?.provider.getL1Address(), [lightGodwoken]);
  const { unlockHistory, setUnlockHistory } = useL1UnlockHistory(`${godwokenVersion}/${l1Address}/unlock`);
  useEffect(() => {
    const removed = unlockHistory.filter((row) => !completedLayer1TxHashList.includes(row.withdrawalTxHash));
    if (removed.length < unlockHistory.length) {
      setUnlockHistory(removed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedList]);

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
          {pendingList.length === 0 && "There is no pending withdrawal request here"}
          {pendingList.map((withdraw, index) => (
            <WithdrawalRequestCard now={now} {...withdraw} key={index} />
          ))}
        </div>
      )}
      {isCompleted && (
        <div className="list pending-list">
          {completedList.length === 0 && "There is no completed withdrawal request here"}
          {completedList.map((withdraw: any, index: number) => (
            <WithdrawalRequestCard now={now} {...withdraw} key={index} />
          ))}
        </div>
      )}
      {isLoading && <Placeholder />}
    </WithdrawalListDiv>
  );
};
