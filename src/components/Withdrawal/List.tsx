import React, { useEffect } from "react";
import { useClock } from "../../hooks/useClock";
import { useLightGodwoken, useLightGodwokenVersion } from "../../hooks/useLightGodwoken";
import { useQuery } from "react-query";
import styled from "styled-components";
import { LoadingOutlined } from "@ant-design/icons";
import WithdrawalRequestCard from "./WithdrawalRequestCard";
import { Cell } from "@ckb-lumos/base";

const WithdrawalListDiv = styled.div`
  max-height: 500px;
  min-height: 50px;
  overflow-y: auto;
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  & > div {
    margin-bottom: 16px;
  }
`;
interface Props {
  unlockButton?: (cell: Cell) => JSX.Element;
}
export const WithdrawalList: React.FC<Props> = ({ unlockButton }: Props) => {
  const lightGodwoken = useLightGodwoken();
  const lightGodwokenVersion = useLightGodwokenVersion();
  const now = useClock();
  const withdrawalListQuery = useQuery(
    ["queryWithdrawList", { version: lightGodwoken?.getVersion() }],
    () => {
      return lightGodwoken?.listWithdraw();
    },
    {
      enabled: !!lightGodwoken,
    },
  );

  const { data: withdrawalList } = withdrawalListQuery;

  useEffect(() => {
    withdrawalListQuery.remove();
    withdrawalListQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightGodwoken, lightGodwokenVersion]);

  if (!withdrawalList) {
    return (
      <WithdrawalListDiv>
        <LoadingOutlined />
      </WithdrawalListDiv>
    );
  }
  return (
    <WithdrawalListDiv>
      {withdrawalList.length === 0 && "There is no withdrawal request here"}
      {withdrawalList.map((withdraw, index) => (
        <WithdrawalRequestCard now={now} {...withdraw} key={index} unlockButton={unlockButton}></WithdrawalRequestCard>
      ))}
    </WithdrawalListDiv>
  );
};
