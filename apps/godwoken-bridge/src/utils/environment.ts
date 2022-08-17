console.debug("process.env.REACT_APP_NETWORK: ", process.env.REACT_APP_NETWORK);
console.debug("process.env.NODE_ENV: ", process.env.NODE_ENV);

export const isMainnet = process.env.REACT_APP_NETWORK === "mainnet";
