import sinon from "sinon";
import { generateClaimUSDCTxSkeleton, userSignTransaction } from "../sudtFaucet";
import { testConfig } from "./lightGodwokenConfig";
import { BI, helpers, utils } from "@ckb-lumos/lumos";
import { generateCellInput, randomHexString } from "./utils";
describe("test faucet", () => {
  it("should generateClaimUSDCTxSkeleton and userSignTransaction", async () => {
    const mockCell = generateCellInput(2000);
    const mockCollector = { collect: sinon.stub().returns([mockCell]) };
    const generatedTx = await generateClaimUSDCTxSkeleton(
      testConfig.v1,
      "0x62A67949836b389ec146B3B2187e949F7fAEF679",
      { collector: () => mockCollector },
      "0xb60bf0787fa97c52bb62d41131757954d5bda2f2054fb0c5efa172fa6b945296",
    );
    expect(helpers.createTransactionFromSkeleton(generatedTx).outputs_data[1]).toEqual(
      utils.toBigUInt128LE(BI.from(1000).mul(BI.from(10).pow(18))),
    );
    const signature = await userSignTransaction(generatedTx, { request: sinon.stub().returns(randomHexString(65)) });
    expect(signature.length).toEqual(212);
  });
});
