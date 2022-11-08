import { Web3ReactHooks } from "@web3-react/core";
import { MetaMask } from "@web3-react/metamask";
import { WalletConnect } from "@web3-react/walletconnect";
import { metaMask, hooks as metaMaskHooks } from "./metamask";
import { walletConnect, hooks as walletConnectHooks } from "./walletConnect";

export const connectors = {
  walletConnect: {
    instance: walletConnect,
    hooks: walletConnectHooks,
  },
  injectedConnect: {
    instance: metaMask,
    hooks: metaMaskHooks,
  },
};

// use for Web3ReactProvider in App.tsx
export const connectorArray: [MetaMask | WalletConnect, Web3ReactHooks][] = [
  [metaMask, metaMaskHooks],
  [walletConnect, walletConnectHooks],
];
