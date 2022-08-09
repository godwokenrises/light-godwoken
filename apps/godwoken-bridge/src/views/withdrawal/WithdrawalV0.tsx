import { WalletConnect } from "../../components/WalletConnect";
import { WithdrawalList } from "../../components/Withdrawal/ListV0";
import RequestWithdrawalV0 from "../../components/Withdrawal/RequestWithdrawalV0";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { Card, CardHeader, PageContent, Text } from "../../style/common";

const WithdrawalV0: React.FC = () => {
  const lightGodwoken = useLightGodwoken();

  return (
    <PageContent>
      <Card className="content">
        <WalletConnect />
        <div style={{ opacity: lightGodwoken ? "1" : "0.5" }}>
          <CardHeader>
            <Text className="title">
              <span>Withdrawal</span>
            </Text>
          </CardHeader>
          <div className="request-withdrawal">
            <RequestWithdrawalV0 />
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
