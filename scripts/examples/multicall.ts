import { getContext } from "../context";
import { Contract, Provider, setMulticallAddress } from "ethers-multicall";

const GODWOKEN_TESTNET_V1_USDT_CONTRACT = "0x90fc553aBad2b8B6ffe9282e36db52cE6388C648";
const GODWOKEN_TESTNET_V1_MULTICALL_CONTRACT = "0x4Eea394b7BAbb203c943275ae3781E47bb92C513";

async function main() {
  const { provider, signer, godwoken } = getContext();

  setMulticallAddress(godwoken.chainId, GODWOKEN_TESTNET_V1_MULTICALL_CONTRACT);

  const ethcallProvider = new Provider(provider, godwoken.chainId);
  const usdc = new Contract(GODWOKEN_TESTNET_V1_USDT_CONTRACT, [
    {
      stateMutability: "view",
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "balance", type: "uint256" }],
      type: "function",
    },
  ]);

  const aliceCall = usdc.balanceOf("0x1234567812345678123456781234567812345678");
  const bobCall = usdc.balanceOf(signer.address);

  const [aliceBalance, bobBalance] = await ethcallProvider.all([aliceCall, bobCall]);

  console.log("ETH Balance:", aliceBalance.toString());
  console.log("DAI Balance:", bobBalance.toString());
}

main();
