import React from "react";
import { WithdrawalList } from "../../components/Withdrawal/ListV1";
import RequestWithdrawalV1 from "../../components/Withdrawal/RequestWithdrawalV1";
import { Card, CardHeader, PageContent, Text } from "../../style/common";
import { WalletInfo } from "../../components/WalletInfo";
import { WalletConnect } from "../../components/WalletConnect";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { useGodwokenVersion } from "../../hooks/useGodwokenVersion";
import { useL1TxHistory } from "../../hooks/useL1TxHistory";

const WithdrawalV1: React.FC = () => {
  const lightGodwoken = useLightGodwoken();
  const godwokenVersion = useGodwokenVersion();
  const l1Address = lightGodwoken?.provider.getL1Address();
  const { txHistory, addTxToHistory, removeTxWithTxHashes } = useL1TxHistory(
    `${godwokenVersion}/${l1Address}/withdrawal`,
  );

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
          <WalletInfo hideDepositAddress={true} />
          <div className="request-withdrawal">
            <RequestWithdrawalV1 addTxToHistory={addTxToHistory} />
          </div>
        </div>
      </Card>
      {lightGodwoken && (
        <Card className="content">
          <WithdrawalList txHistory={txHistory} removeTxWithTxHashes={removeTxWithTxHashes} />
        </Card>
      )}
    </PageContent>
  );
};

export default WithdrawalV1;
