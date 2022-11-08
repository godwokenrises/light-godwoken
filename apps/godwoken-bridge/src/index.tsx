import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "antd/dist/antd.css";
import "./index.css";

import { config } from "@ckb-lumos/lumos";

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import { LightGodwokenError } from "light-godwoken";
import { isMainnet } from "./utils/environment";
import { Web3ReactProvider } from "@web3-react/core";
import { connectorArray } from "./components/WalletConnect/connectors";

if (process.env.NODE_ENV === "production") {
  Sentry.init({
    environment: process.env.NODE_ENV,
    release: "light-godwoken@" + process.env.REACT_APP_VERSION + "@" + process.env.REACT_APP_COMMIT_HASH,
    debug: false,
    dsn: process.env.REACT_APP_SENTRY_DSN,
    integrations: [new BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
    allowUrls: [
      /http?:\/\/localhost/,
      /https?:\/\/bridge\.godwoken\.io/,
      /https?:\/\/mainnet\.bridge\.godwoken\.io/,
      /https?:\/\/testnet\.bridge\.godwoken\.io/,
      /https?:\/\/godwoken-bridge\.vercel\.app/,
      /https?:\/\/godwoken-bridge-mainnet\.vercel\.app/,
    ],
    beforeSend: function (event, hint) {
      const exception = hint?.originalException;
      if (exception instanceof LightGodwokenError) {
        event.fingerprint = ["light-godwoken-error"];
      }
      return event;
    },
  });
}

config.initializeConfig(isMainnet ? config.predefined.LINA : config.predefined.AGGRON4);

ReactDOM.render(
  <React.StrictMode>
    <Web3ReactProvider connectors={connectorArray}>
      <App />
    </Web3ReactProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);

reportWebVitals();
