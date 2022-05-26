import { TransactionHistory } from "../../components/TransactionHistory";
import { WithdrawalList } from "../../components/Withdrawal/List";
import RequestWithdrawalV1 from "../../components/Withdrawal/RequestWithdrawalV1";
import { Card, CardHeader, PageContent, Text } from "../../style/common";
import { WalletConnect } from "../../components/WalletConnect";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";

const WithdrawalV1: React.FC = () => {
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
            <RequestWithdrawalV1></RequestWithdrawalV1>
          </div>
        </div>
      </Card>
      {lightGodwoken && (
        <Card className="content">
          <WithdrawalList></WithdrawalList>
        </Card>
      )}
    </PageContent>
  );
};

export default WithdrawalV1;
