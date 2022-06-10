import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "bootstrap/dist/css/bootstrap.min.css";
import "antd/dist/antd.css";
import "./index.css";

import { config } from "@ckb-lumos/lumos";

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
import { LightGodwokenError } from "./light-godwoken/constants/error";

if (process.env.NODE_ENV === "production" || true) {
  Sentry.init({
    environment: process.env.NODE_ENV,
    release: "light-godwoken@" + process.env.REACT_APP_VERSION + "@" + process.env.REACT_APP_COMMIT_HASH,
    debug: false,
    // dsn: "https://cee76b0263164a9b89c918b194cedbf8@o1235895.ingest.sentry.io/6385985",
    dsn: "https://4f42ad25553a4472bc6f64a8ed2c432c@sentry.nervos.org/17",
    integrations: [new BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
    // allowUrls: [
    //   /https?:\/\/testnet\.bridge\.godwoken\.io/,
    //   /https?:\/\/light-godwoken\.vercel\.app/,
    //   /https?:\/\/light-godwoken-mainnet\.vercel\.app/,
    // ],
    beforeSend: function (event, hint) {
      const exception = hint?.originalException;
      if (exception instanceof LightGodwokenError) {
        event.fingerprint = ["light-godwoken-error"];
      }
      return event;
    },
  });
}

config.initializeConfig(config.predefined.AGGRON4);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root"),
);

reportWebVitals();
