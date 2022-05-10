import { TransactionHistory } from "../../components/TransactionHistory";
import { WithdrawalList } from "../../components/Withdrawal/List";
import RequestWithdrawalV1 from "../../components/Withdrawal/RequestWithdrawalV1";
import { PageContent, ResultList } from "./WithdrawalStyle";

const WithdrawalV1: React.FC = () => {
  return (
    <>
      <PageContent className="content">
        <div className="header">
          <div className="title">Withdrawal</div>
          {/* <TransactionHistory type="withdrawal"></TransactionHistory> */}
        </div>
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
