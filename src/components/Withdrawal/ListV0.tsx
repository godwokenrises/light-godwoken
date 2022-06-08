import React, { useState } from "react";
import { useClock } from "../../hooks/useClock";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { useQuery } from "react-query";
import styled from "styled-components";
import WithdrawalRequestCard from "./WithdrawalItemV0";
import { Cell } from "@ckb-lumos/base";
import { Placeholder } from "../Placeholder";
import { useL1TxHistory } from "../../hooks/useL1TxHistory";
import { LinkList, Tab } from "../../style/common";
import { useGodwokenVersion } from "../../hooks/useGodwokenVersion";

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
  unlockButton?: (cell?: Cell) => JSX.Element;
}
export const WithdrawalList: React.FC<Props> = ({ unlockButton }: Props) => {
  const lightGodwoken = useLightGodwoken();
  const godwokenVersion = useGodwokenVersion();
  const l1Address = lightGodwoken?.provider.getL1Address();
  const { txHistory } = useL1TxHistory(`${godwokenVersion}/${l1Address}/withdrawal`);

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

  const pendingList =
    withdrawalList?.map((history) => {
      return {
        ...history,
        status: "pending",
        cell: history.cell,
        remainingBlockNumber: history.remainingBlockNumber,
      };
    }) || [];
  const completedList = txHistory.filter((history) => history.status === "success" || history.status === "fail");

  if (!lightGodwoken) {
    return <WithdrawalListDiv>please connect wallet first</WithdrawalListDiv>;
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
            <WithdrawalRequestCard now={now} {...withdraw} key={index}></WithdrawalRequestCard>
          ))}
        </div>
      )}
      {active !== "pending" && (
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
