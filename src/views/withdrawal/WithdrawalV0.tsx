import { WithdrawalList } from "../../components/Withdrawal/List";
import Unlock from "../../components/Withdrawal/Unlock";
import RequestWithdrawal from "../../components/Withdrawal/RequestWithdrawalV0";
import { TransactionHistory } from "../../components/TransactionHistory";
import { ResultList } from "./WithdrawalStyle";
import { Card, CardHeader, PageContent, Text } from "../../style/common";

const WithdrawalV0: React.FC = () => {
  return (
    <PageContent>
      <Card className="content">
        <CardHeader>
          <Text className="title">
            <span>Withdrawal</span>
            <TransactionHistory type="withdrawal"></TransactionHistory>
          </Text>
        </CardHeader>
        <div className="request-withdrawal">
          <RequestWithdrawal></RequestWithdrawal>
        </div>
      </Card>
      <Card className="content">
        <ResultList>
          <CardHeader>
            <Text className="title">
              <span>Withdrawal Request List</span>
            </Text>
          </CardHeader>
          <div className="list">
            <WithdrawalList unlockButton={(cell) => <Unlock cell={cell}></Unlock>}></WithdrawalList>
          </div>
        </ResultList>
      </Card>
    </PageContent>
  );
};

export default WithdrawalV0;
