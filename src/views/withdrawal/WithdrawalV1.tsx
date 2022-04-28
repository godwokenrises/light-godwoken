import { TransactionHistory } from "../../components/TransactionHistory";
import { WithdrawalList } from "../../components/Withdrawal/List";
import RequestWithdrawalV1 from "../../components/Withdrawal/RequestWithdrawalV1";
import { ResultList, WithdrawalHeader } from "./WithdrawalStyle";
import { PageContent } from "../../style/common";

const WithdrawalV1: React.FC = () => {
  return (
    <>
      <PageContent className="content">
        <WithdrawalHeader>
          <div className="title">Withdrawal</div>
          <TransactionHistory type="withdrawal"></TransactionHistory>
        </WithdrawalHeader>
        <div className="request-withdrawal">
          <RequestWithdrawalV1></RequestWithdrawalV1>
        </div>
        <ResultList className="withdrawal-request">
          <div className="header">Withdrawal Requests List</div>
          <div className="list">
            <WithdrawalList></WithdrawalList>
          </div>
        </ResultList>
      </PageContent>
    </>
  );
};

export default WithdrawalV1;
