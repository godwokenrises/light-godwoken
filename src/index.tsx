import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "bootstrap/dist/css/bootstrap.min.css";
import { config } from "@ckb-lumos/lumos";

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
Sentry.init({
  environment: process.env.NODE_ENV,
  release: "light-godwoken@" + "0.1.0",
  debug: false,
  dsn: "https://cee76b0263164a9b89c918b194cedbf8@o1235895.ingest.sentry.io/6385985",
  integrations: [new BrowserTracing()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

config.initializeConfig(config.predefined.AGGRON4);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root"),
);

reportWebVitals();
