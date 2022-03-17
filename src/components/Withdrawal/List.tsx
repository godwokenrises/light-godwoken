import { useClock } from "../../hooks/useClock";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { useQuery } from "react-query";
import styled from "styled-components";
import { LoadingOutlined } from "@ant-design/icons";
import WithdrawalRequestCard from "./WithdrawalRequestCard";

const WithdrawalListDiv = styled.div`
  max-height: calc(100vh - 400px);
  overflow-y: auto;
  background-color: rgb(16, 12, 24);
  padding: 24px;
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  & > div {
    margin-bottom: 16px;
  }
`;

export const WithDrawalList: React.FC = () => {
  const lightGodwoken = useLightGodwoken();
  const now = useClock();
  const { data: withDrawalList } = useQuery(
    ["queryWithdrawList", { version: lightGodwoken?.getVersion() }],
    () => {
      return lightGodwoken?.listWithdraw();
    },
    {
      enabled: !!lightGodwoken,
    },
  );

  if (!withDrawalList) {
    return (
      <WithdrawalListDiv>
        <LoadingOutlined />
      </WithdrawalListDiv>
    );
  }
  return (
    <WithdrawalListDiv>
      {withDrawalList.map((withdraw, index) => (
        <WithdrawalRequestCard now={now} {...withdraw} key={index}></WithdrawalRequestCard>
      ))}
    </WithdrawalListDiv>
  );
};
