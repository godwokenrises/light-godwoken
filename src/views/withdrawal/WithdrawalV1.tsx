import { TransactionHistory } from "../../components/TransactionHistory";
import { WithdrawalList } from "../../components/Withdrawal/List";
import RequestWithdrawalV1 from "../../components/Withdrawal/RequestWithdrawalV1";
import { ResultList } from "./WithdrawalStyle";
import { Card, CardHeader, PageContent, Text } from "../../style/common";

const WithdrawalV1: React.FC = () => {
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
          <RequestWithdrawalV1></RequestWithdrawalV1>
        </div>
      </Card>
      <Card className="content">
        <ResultList className="withdrawal-request">
          <CardHeader>
            <Text className="title">
              <span>Withdrawal Request List</span>
            </Text>
          </CardHeader>
          <div className="list">
            <WithdrawalList></WithdrawalList>
          </div>
        </ResultList>
      </Card>
    </PageContent>
  );
};

export default WithdrawalV1;
