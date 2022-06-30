import { providers, Wallet } from "ethers";
import { PolyjuiceJsonRpcProvider, PolyjuiceWallet } from "@polyjuice-provider/ethers";

require("./env");

type Context = {
  godwoken: {
    version: "v0" | "v1";
    rpcUrl: string;
    chainId: number;

    rollupTypeHash?: string;
    ethAccountLockCodeHash?: string;
  };
};

const GODWOKEN_V1_TESTNET: Context = {
  godwoken: {
    version: "v1",
    rpcUrl: "https://godwoken-testnet-v1.ckbapp.dev",
    chainId: 71401,
  },
};

const GODWOKEN_V1_MAINNET: Context = {
  godwoken: {
    version: "v1",
    rpcUrl: "https://v1.mainnet.godwoken.io/rpc",
    chainId: 71402,
  },
};

const GODWOKEN_V0_TESTNET: Context = {
  godwoken: {
    version: "v0",
    rpcUrl: "https://godwoken-testnet-web3-rpc.ckbapp.dev",
    chainId: 71393,

    rollupTypeHash: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a",
    ethAccountLockCodeHash: "0xdeec13a7b8e100579541384ccaf4b5223733e4a5483c3aec95ddc4c1d5ea5b22",
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
  const { version, rpcUrl } = context.godwoken;

  const provider: providers.JsonRpcProvider = (() => {
    if (version === "v0") {
      return new PolyjuiceJsonRpcProvider({ ...context.godwoken }, rpcUrl);
    }

    if (version === "v1") {
      return new providers.JsonRpcProvider(rpcUrl);
    }
  })();

  const signer: Wallet = (() => {
    if (version === "v0") {
      return new PolyjuiceWallet(privateKey, { ...context.godwoken, web3Url: rpcUrl }, provider);
    }

    if (version === "v1") {
      return new Wallet(privateKey, provider);
    }
  })();

  return { ...context, provider, signer };
}
