import Page from "./Page";
import styled from "styled-components";
import { Link, useParams } from "react-router-dom";
import { WithDrawalList } from "../components/Withdrawal/List";
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
    margin-bottom: 8px;
  }
  .description {
    font-weight: 400;
    line-height: 1.5;
    font-size: 14px;
  }
  .button-container {
    margin-top: 16px;
  }
  .request-button {
    -webkit-box-align: center;
    align-items: center;
    border: 0px;
    border-radius: 16px;
    box-shadow: rgb(14 14 44 / 40%) 0px -1px 0px 0px inset;
    cursor: pointer;
    display: inline-flex;
    font-family: inherit;
    font-size: 16px;
    font-weight: 600;
    -webkit-box-pack: center;
    justify-content: center;
    letter-spacing: 0.03em;
    line-height: 1;
    opacity: 1;
    outline: 0px;
    transition: background-color 0.2s ease 0s, opacity 0.2s ease 0s;
    height: 48px;
    padding: 0px 24px;
    background-color: rgb(255, 67, 66);
    color: white;
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

const Withdrawal: React.FC<React.HTMLAttributes<HTMLDivElement>> = () => {
  const params = useParams();

  return (
    <Page>
      <PageContent className="content">
        <div className="request-withdrawal">
          <div className="title">Withdrawal</div>
          <div className="description">
            To withdraw assets back to Layer 1, you need to have CKB balance in your L1 Wallet Address
          </div>
          <div className="button-container">
            <Link to={"/" + params.version + "/request-withdrawal"} className="request-button">
              Request Withdrawal
            </Link>
          </div>
        </div>
        <ResultList className="withdrawal-request">
          <div className="header">Your Withdrawal Requests</div>
          <div className="list">
            <WithDrawalList></WithDrawalList>
          </div>
        </ResultList>
      </PageContent>
    </Page>
  );
};

export default Withdrawal;
