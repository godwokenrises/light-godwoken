import React from "react";
import styled from "styled-components";
import Tooltip from "antd/lib/tooltip";
import QuestionCircleOutlined from "@ant-design/icons/lib/icons/QuestionCircleOutlined";
import { LinkList, Tab } from "../../style/common";
import { useClock } from "../../hooks/useClock";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { useQuery } from "react-query";
import { Placeholder } from "../Placeholder";
import { LightGodwokenV0 } from "light-godwoken";
import WithdrawalRequestCard from "./WithdrawalItemV0";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { createLightGodwokenV1 } from "../../utils/lightGodwoken";
import { providers } from "ethers";

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

  const lightGodwoken = useLightGodwoken();
  const now = useClock();

  const withdrawalListQuery = useQuery(
    ["queryWithdrawList", { version: lightGodwoken?.getVersion(), l2Address: lightGodwoken?.provider.getL2Address() }],
    () => {
      const lightGodwokenV1 = createLightGodwokenV1(
        lightGodwoken!.provider.getL2Address(),
        lightGodwoken!.provider.getNetwork(),
        (lightGodwoken!.provider.ethereum.provider as providers.Web3Provider).provider,
      );

      const normalWithdrawalList = (lightGodwoken as LightGodwokenV0).listWithdrawWithScannerApi();
      const fastWithdrawalList = (lightGodwoken as LightGodwokenV0).listFastWithdrawWithScannerApi(lightGodwokenV1);
      return Promise.all([normalWithdrawalList, fastWithdrawalList]);
    },
    {
      enabled: !!lightGodwoken,
    },
  );
  const { data: withdrawalList, isLoading } = withdrawalListQuery;
  const formattedWithdrawalList = withdrawalList ? [...withdrawalList[0], ...withdrawalList[1]] : [];
  const sortedWithdrawalList = formattedWithdrawalList.sort(
    (a, b) => b.withdrawalBlockNumber - a.withdrawalBlockNumber,
  );
  const pendingList = sortedWithdrawalList.filter((history) => history.status === "pending");
  const completedList = sortedWithdrawalList.filter(
    (history) => history.status === "success" || history.status === "failed",
  );

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
          {pendingList.length === 0 && "There is no pending withdrawal request here"}
          {pendingList.map((withdraw, index) => (
            <WithdrawalRequestCard now={now} {...withdraw} key={index}></WithdrawalRequestCard>
          ))}
        </div>
      )}
      {isCompleted && (
        <div className="list pending-list">
          {completedList.length === 0 && "There is no completed withdrawal request here"}
          {completedList.map((withdraw: any, index: number) => (
            <WithdrawalRequestCard now={now} {...withdraw} key={index}></WithdrawalRequestCard>
          ))}
        </div>
      )}
      {isLoading && <Placeholder />}
    </WithdrawalListDiv>
  );
};
