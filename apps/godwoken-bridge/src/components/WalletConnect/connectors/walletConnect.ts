import { initializeConnector } from "@web3-react/core";
import { WalletConnect } from "@web3-react/walletconnect";
import { GodwokenNetwork, GodwokenVersion, initConfig } from "light-godwoken";
import { isMainnet } from "../../../utils/environment";

type Rpc = {
  [key: string]: string;
};

// get rpc info
const rpc: Rpc = {};
const getRpcInfo = (version: GodwokenVersion) => {
  const network = isMainnet ? GodwokenNetwork.Mainnet : GodwokenNetwork.Testnet;
  const config = initConfig(network, version);
  const chainId = config.layer2Config.GW_POLYJUICE_CHAIN_ID;
  const url = config.layer2Config.GW_POLYJUICE_RPC_URL;
  return { chainId, url };
};

const { chainId: chainIdV0, url: urlV0 } = getRpcInfo(GodwokenVersion.V0);
const { chainId: chainIdV1, url: urlV1 } = getRpcInfo(GodwokenVersion.V1);

rpc[chainIdV1.toString()] = urlV1;
rpc[chainIdV0.toString()] = urlV0;

export const [walletConnect, hooks] = initializeConnector<WalletConnect>(
  (actions) =>
    new WalletConnect({
      actions,
      options: {
        rpc,
        bridge: "https://bridge.walletconnect.org",
        qrcode: true,
      },
    }),
);
