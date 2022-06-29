# Light Godwoken

This is a demo UI for depositing and withdrawing assets to Godwoken, which is a CKB Layer 2 chain to CKB chain.
You will need to have MetaMask installed to use this demo.

## Quick Start

- MetaMask
- NodeJS >= 14

```sh
yarn install
yarn start
```

## Documentation

- [How to Withdraw Asset from Godwoken to CKB](docs/how-to-withdraw-from-godwoken.md)
- [How to Get Test Tokens](docs/test-tokens.md)

## How to Use

```ts
import detectEthereumProvider from "@metamask/detect-provider";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import Page from "./components/Layout/Page";
import { LightGodwokenContext } from "./contexts/LightGodwokenContext";
import { LightGodwokenV1 } from "./light-godwoken";
import DefaultLightGodwoken from "./light-godwoken/lightGodwoken";
import DefaultLightGodwokenProvider from "./light-godwoken/lightGodwokenProvider";
import LightGodwokenApp from "./views/LightGodwokenApp";
function App() {
  const queryClient = new QueryClient();
  const [lightGodwoken, setLightGodwoken] = useState<DefaultLightGodwoken>();

  useEffect(() => {
    detectEthereumProvider().then((ethereum: any) => {
      ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        if (!accounts || !accounts[0]) return;
        const lightGodwokenV1 = new LightGodwokenV1(new DefaultLightGodwokenProvider(accounts[0], ethereum, "v1"));
        setLightGodwoken(lightGodwokenV1);
      });

      ethereum.on("accountsChanged", (accounts: string[] | undefined) => {
        if (!accounts || !accounts[0]) return;
        const lightGodwokenV1 = new LightGodwokenV1(new DefaultLightGodwokenProvider(accounts[0], ethereum, "v1"));
        setLightGodwoken(lightGodwokenV1);
      });
    });
  }, [lightGodwoken]);
  return (
    <QueryClientProvider client={queryClient}>
      <LightGodwokenContext.Provider value={lightGodwoken}>
        <Page>
          <LightGodwokenApp activeView="deposit" />
        </Page>
      </LightGodwokenContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
```
