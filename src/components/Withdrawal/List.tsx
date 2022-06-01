import React from "react";
import { useClock } from "../../hooks/useClock";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { useQuery } from "react-query";
import styled from "styled-components";
import WithdrawalRequestCard from "./WithdrawalRequestCard";
import { Cell } from "@ckb-lumos/base";
import { Placeholder } from "../Placeholder";
import { LightGodwokenV1 } from "../../light-godwoken";

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
  unlockButton?: (cell?: Cell) => JSX.Element;
}
export const WithdrawalList: React.FC<Props> = ({ unlockButton }: Props) => {
  const lightGodwoken = useLightGodwoken();
  const now = useClock();
  const withdrawalListQuery = useQuery(
    ["queryWithdrawList", { version: lightGodwoken?.getVersion(), l2Address: lightGodwoken?.provider.getL2Address() }],
    () => {
      // if(lightGodwoken?.getVersion() === 'v1') {
      //   return (lightGodwoken as LightGodwokenV1).listWithdrawWithScannerApi();
      // }
      return lightGodwoken?.listWithdraw();
    },
    {
      enabled: !!lightGodwoken,
    },
  );

  const { data: withdrawalList } = withdrawalListQuery;
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
      {withdrawalList.length === 0 && "There is no withdrawal request here"}
      {withdrawalList.map((withdraw, index) => (
        <WithdrawalRequestCard now={now} {...withdraw} key={index} unlockButton={unlockButton}></WithdrawalRequestCard>
      ))}
    </WithdrawalListDiv>
  );
};
