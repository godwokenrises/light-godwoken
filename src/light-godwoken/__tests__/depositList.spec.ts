import sinon from "sinon";
import LightGodwokenV0 from "../LightGodwokenV0";
import DefaultLightGodwokenProvider from "../lightGodwokenProvider";
import { testConfig } from "./lightGodwokenConfig";
import { generateCellInput } from "./utils";

let lightGodwokenV0: LightGodwokenV0;
let lightGodwokenProviderV0: DefaultLightGodwokenProvider;
beforeEach(() => {
  const ethAddress = "0x62A67949836b389ec146B3B2187e949F7fAEF679";
  const dummyEthereum = {
    on: () => {},
  };
  lightGodwokenProviderV0 = new DefaultLightGodwokenProvider(ethAddress, dummyEthereum, "v0", testConfig.v0);
  lightGodwokenV0 = new LightGodwokenV0(lightGodwokenProviderV0);
});

describe("test light godwoken v0 deposit list", () => {
  it("should generateDepositLock works fine", async () => {
    const mockCells = [generateCellInput(501), generateCellInput(403)];
    const mockCollector = { collect: sinon.stub().returns(mockCells) };
    sinon.stub(lightGodwokenProviderV0.ckbIndexer, "collector").returns(mockCollector);
    const depositList = await lightGodwokenV0.getDepositList();
    expect(depositList.length).toBe(2);
    expect(depositList[0].capacity.toString()).toBe("50100000000");
    expect(depositList[1].capacity.toString()).toBe("40300000000");
  });
});
