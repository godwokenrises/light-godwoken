import { BigNumberish, ContractFactory, providers, Wallet } from "ethers";
import * as fs from "fs";
import path from "path";

require("./env");

const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  throw new Error("Please create scripts/.env.local, and set PRIVATE_KEY");
}

// https://github.com/nervosnetwork/godwoken-polyjuice/blob/main/solidity/erc20/SudtERC20Proxy_UserDefinedDecimals.bin
const BYTECODE = fs.readFileSync(path.join(__dirname, "./erc20/SudtERC20Proxy_UserDefinedDecimals.bin")).toString();
// https://github.com/nervosnetwork/godwoken-polyjuice/blob/main/solidity/erc20/SudtERC20Proxy_UserDefinedDecimals.abi
// prettier-ignore
const CONTRACT_INTERFACE = fs.readFileSync(path.join(__dirname, "/erc20/SudtERC20Proxy_UserDefinedDecimals.abi")).toString();
const RPC_URL = "https://godwoken-testnet-v1.ckbapp.dev";

const provider = new providers.JsonRpcProvider(RPC_URL);
const signer = new Wallet(PRIVATE_KEY, provider);

function log<T>(x: T): T {
  console.log(x);
  return x;
}

interface Options {
  name: string;
  symbol: string;
  totalSupply?: BigNumberish;
  sudtId: BigNumberish;
  decimals?: BigNumberish;
}

function getDeployTransaction(options: Options) {
  const {
    name,
    symbol,
    sudtId,
    totalSupply = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    decimals = 18,
  } = options;
  const factory = new ContractFactory(CONTRACT_INTERFACE, BYTECODE, signer);
  return factory.getDeployTransaction(name, symbol, totalSupply, sudtId, decimals);
}

async function main() {
  const options: Options[] = [
    { sudtId: 80, symbol: "TTKN", name: "Godwoken Bridge Test Token" },
    { sudtId: 29378, symbol: "DAI|eth", name: "Wrapped DAI (ForceBridge from Ethereum)" },
    {
      sudtId: 29407,
      symbol: "USDC|eth",
      name: "Wrapped USDC (ForceBridge from Ethereum)",
      decimals: 6,
    },
    {
      sudtId: 29406,
      symbol: "USDT|eth",
      name: "Wrapped USDT (ForceBridge from Ethereum)",
      decimals: 6,
    },
    { sudtId: 5681, symbol: "ETH|eth", name: "Wrapped ETH (ForceBridge from Ethereum)" },
  ];

  for (const option of options) {
    const tx = getDeployTransaction(option);
    await signer
      .sendTransaction({ ...tx, gasLimit: 1000000 })
      .then((tx) => tx.wait())
      .then((receipt) => {
        console.log(option.symbol, "\n", receipt.contractAddress);
      });
  }
}

// main();
