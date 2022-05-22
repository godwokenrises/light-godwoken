import React from "react";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { useQuery } from "react-query";
import styled from "styled-components";
import DepositItem from "./DepositItem";
import { Placeholder } from "../Placeholder";

const DepositListDiv = styled.div`
  max-height: 500px;
  min-height: 50px;
  overflow-y: auto;
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  & > div {
    margin-bottom: 16px;
  }
`;
export const DepositList: React.FC = () => {
  const lightGodwoken = useLightGodwoken();
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
  if (!depositList) {
    return (
      <DepositListDiv>
        <Placeholder />
      </DepositListDiv>
    );
  }
  return (
    <DepositListDiv>
      {depositList.length === 0 && "There is no padding deposit request here"}
      {depositList.map((deposit, index) => (
        <DepositItem {...deposit} key={index}></DepositItem>
      ))}
    </DepositListDiv>
  );
};
