import { WithdrawalList } from "../../components/Withdrawal/ListV0";
import RequestWithdrawal from "../../components/Withdrawal/RequestWithdrawalV0";
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
            </Text>
          </CardHeader>
          <div className="request-withdrawal">
            <RequestWithdrawal></RequestWithdrawal>
          </div>
        </div>
      </Card>
      {lightGodwoken && (
        <Card className="content">
          <WithdrawalList />
        </Card>
      )}
    </PageContent>
  );
};

export default WithdrawalV0;
