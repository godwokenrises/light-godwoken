import { debug } from "./debug";

debug("process.env.REACT_APP_NETWORK: ", process.env.REACT_APP_NETWORK);
export const isMainet = process.env.REACT_APP_NETWORK === "mainnet";
