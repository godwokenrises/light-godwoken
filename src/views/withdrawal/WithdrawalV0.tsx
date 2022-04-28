import { WithdrawalList } from "../../components/Withdrawal/List";
import Unlock from "../../components/Withdrawal/Unlock";
import RequestWithdrawal from "../../components/Withdrawal/RequestWithdrawalV0";
import { TransactionHistory } from "../../components/TransactionHistory";
import { ResultList, WithdrawalHeader } from "./WithdrawalStyle";
import { PageContent } from "../../style/common";

const WithdrawalV0: React.FC = () => {
  return (
    <>
      <PageContent className="content">
        <WithdrawalHeader>
          <div className="title">Withdrawal</div>
          <TransactionHistory type="withdrawal"></TransactionHistory>
        </WithdrawalHeader>
        <div className="request-withdrawal">
          <RequestWithdrawal></RequestWithdrawal>
        </div>
        <ResultList className="withdrawal-request">
          <div className="header">Withdrawal Requests List</div>
          <div className="list">
            <WithdrawalList unlockButton={(cell) => <Unlock cell={cell}></Unlock>}></WithdrawalList>
          </div>
        </ResultList>
      </PageContent>
    </>
  );
};

export default WithdrawalV0;
