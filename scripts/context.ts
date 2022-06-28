import { providers, Wallet } from "ethers";
import { PolyjuiceHttpProvider } from "@polyjuice-provider/web3";
import { AbiItems } from "@polyjuice-provider/base";
import fs from "fs";
import path from "path";

require("./env");

type Context = {
  godwoken: {
    version: "v0" | "v1";
    rpcUrl: string;
    chainId: number;
  };
};

const GODWOKEN_V1_TESTNET: Context = {
  godwoken: {
    version: "v1",
    rpcUrl: "https://godwoken-testnet-v1.ckbapp.dev",
    chainId: 71401,
  },
};

const GODWOKEN_V0_TESTNET: Context = {
  godwoken: {
    version: "v0",
    rpcUrl: "https://godwoken-testnet-web3-rpc.ckbapp.dev",
    chainId: 71393,
  },
};

const context = GODWOKEN_V1_TESTNET;

export function log<T>(x: T): T {
  console.log(x);
  return x;
}

export function getContext() {
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("Please create scripts/.env.local, and set PRIVATE_KEY");
  }

  const provider = (() => {
    const { version, rpcUrl } = context.godwoken;

    if (version === "v0") {
      const poly = new PolyjuiceHttpProvider(rpcUrl, {
        web3Url: rpcUrl,
        abiItems: JSON.parse(
          fs.readFileSync(path.join(__dirname, "/erc20/SudtERC20Proxy_UserDefinedDecimals.abi")).toString(),
        ) as AbiItems,
      });
      return new providers.Web3Provider(poly);
    }

    return new providers.JsonRpcProvider(rpcUrl);
  })();

  const signer = new Wallet(privateKey, provider);
  return { ...context, provider, signer };
}
