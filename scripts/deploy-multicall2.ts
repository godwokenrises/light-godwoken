import { getContext } from "./context";
import { ContractFactory } from "ethers";
import fs from "fs";
import path from "path";

const CONTRACT_INTERFACE = fs.readFileSync(path.join(__dirname, "/multicall2/Multicall2.abi")).toString();
const BYTECODE = fs.readFileSync(path.join(__dirname, "./Multicall2/Multicall2.bin")).toString();

async function main() {
  const { signer } = getContext();

  const factory = new ContractFactory(CONTRACT_INTERFACE, BYTECODE, signer);
  const tx = factory.getDeployTransaction();

  try {
    await signer
      .sendTransaction({ ...tx, gasLimit: 1000000 })
      .then((tx) => {
        console.log(tx.hash);
        return tx.wait();
      })
      .then((receipt) => {
        console.log(receipt.contractAddress);
      });
  } catch (e) {

  }
}

main();
