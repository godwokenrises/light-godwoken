import styled from "styled-components";
import { WithdrawalList } from "../components/Withdrawal/List";
import RequestWithdrawalV1 from "../components/Withdrawal/RequestWithdrawalV1";

const PageContent = styled.div`
  width: 436px;
  background: rgb(39, 37, 52);
  border-radius: 24px;
  color: white;
  .request-withdrawal {
    padding: 24px;
  }
  .title {
    font-size: 20px;
    font-weight: 600;
    line-height: 1.1;
    margin-bottom: 20px;
  }
`;

const ResultList = styled.div`
  > .header {
    -webkit-box-align: center;
    align-items: center;
    -webkit-box-pack: justify;
    justify-content: space-between;
    padding: 24px;
    width: 100%;
    border-bottom: 1px solid rgb(60, 58, 75);
    border-top: 1px solid rgb(60, 58, 75);
    font-size: 16px;
    font-weight: 600;
    line-height: 1.5;
  }
`;

const WithdrawalV1: React.FC = () => {
  return (
    <>
      <PageContent className="content">
        <div className="request-withdrawal">
          <div className="title">Withdrawal</div>
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
