import { useLightGodwoken } from "../hooks/useLightGodwoken";
import { Card, CardHeader, PageContent, Text } from "../style/common";
import { WalletConnect } from "../components/WalletConnect";
import RequestL1Transfer from "../components/L1Transfer/RequestL1Transfer";
import L1TransferList from "../components/L1Transfer/L1TransferList";

export default function L1Transfer() {
  // light-godwoken client
  const lightGodwoken = useLightGodwoken();

  return (
    <PageContent>
      <Card className="content">
        <WalletConnect />
        <div style={{ opacity: lightGodwoken ? "1" : "0.5" }}>
          <CardHeader>
            <Text className="title">
              <span>L1 Transfer</span>
            </Text>
          </CardHeader>
          <RequestL1Transfer />
        </div>
      </Card>
      {lightGodwoken && (
        <Card className="content">
          <L1TransferList />
        </Card>
      )}
    </PageContent>
  );
}
