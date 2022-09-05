import sinon from "sinon";
import LightGodwokenV0 from "../LightGodwokenV0";
import LightGodwokenProvider from "../lightGodwokenProvider";
import { generateCellInput } from "./utils";
import { createLightGodwoken } from "./client";

let lightGodwokenV0: LightGodwokenV0;
let lightGodwokenProviderV0: LightGodwokenProvider;
beforeEach(() => {
  const ethAddress = "0x62A67949836b389ec146B3B2187e949F7fAEF679";
  lightGodwokenV0 = createLightGodwoken(ethAddress, "testnet", "v0");
  lightGodwokenProviderV0 = lightGodwokenV0.provider;
});

describe("test light godwoken v0 deposit list", () => {
  // v0 test cases are hidden due to deprecation of testnet_v0
  /*it("should generateDepositLock works fine", async () => {
    const mockCells = [generateCellInput(501), generateCellInput(403)];
    const mockCollector = { collect: sinon.stub().returns(mockCells) };
    sinon.stub(lightGodwokenProviderV0.ckbIndexer, "collector").returns(mockCollector);
    const depositList = await lightGodwokenV0.getDepositList();
    expect(depositList.length).toBe(2);
    expect(depositList[0].capacity.toString()).toBe("50100000000");
    expect(depositList[1].capacity.toString()).toBe("40300000000");
  });*/
});
