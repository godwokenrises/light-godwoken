import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "antd/dist/antd.css";
import "./index.css";

import { config } from "@ckb-lumos/lumos";

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import { LightGodwokenError } from "./light-godwoken/constants/error";
import { isMainnet } from "./light-godwoken/env";

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
      /https?:\/\/testnet\.bridge\.godwoken\.io/,
      /https?:\/\/light-godwoken\.vercel\.app/,
      /https?:\/\/light-godwoken-mainnet\.vercel\.app/,
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
    <App />
  </React.StrictMode>,
  document.getElementById("root"),
);

reportWebVitals();
