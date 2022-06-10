import { debug } from "./debug";

debug("process.env.NODE_ENV: ", process.env.NODE_ENV);
debug("process.env.REACT_APP_NETWORK: ", process.env.REACT_APP_NETWORK);
export const isMainnet = process.env.REACT_APP_NETWORK === "mainnet";
