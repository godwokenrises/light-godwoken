import { WithdrawalList } from "../../components/Withdrawal/List";
import Unlock from "../../components/Withdrawal/Unlock";
import RequestWithdrawal from "../../components/Withdrawal/RequestWithdrawalV0";
import { TransactionHistory } from "../../components/TransactionHistory";
import { ResultList } from "./WithdrawalStyle";
import { Card, CardHeader, PageContent, Text } from "../../style/common";
import { WalletConnect } from "../../components/WalletConnect";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";

const WithdrawalV0: React.FC = () => {
  const lightGodwoken = useLightGodwoken();

  return (
    <PageContent>
      <Card className="content">
        <WalletConnect></WalletConnect>
        <div style={{ opacity: lightGodwoken ? "1" : "0.5" }}>
          <CardHeader>
            <Text className="title">
              <span>Withdrawal</span>
              <TransactionHistory type="withdrawal"></TransactionHistory>
            </Text>
          </CardHeader>
          <div className="request-withdrawal">
            <RequestWithdrawal></RequestWithdrawal>
          </div>
        </div>
      </Card>
      {lightGodwoken && (
        <Card className="content">
          <ResultList>
            <CardHeader>
              <Text className="title">
                <span>Withdrawal Request List</span>
              </Text>
            </CardHeader>
            <div className="list">
              <WithdrawalList unlockButton={(cell) => <Unlock cell={cell!}></Unlock>}></WithdrawalList>
            </div>
          </ResultList>
        </Card>
      )}
    </PageContent>
  );
};

export default WithdrawalV0;
