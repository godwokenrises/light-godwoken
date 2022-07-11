import sinon from "sinon";
import LightGodwokenV1 from "../LightGodwokenV1";
import LightGodwokenV0 from "../LightGodwokenV0";
import DefaultLightGodwokenProvider from "../lightGodwokenProvider";
import {
  generateCellInput,
  outputCapacityOf,
  randomScript,
  outputSudtAmountOf,
  sudtTypeScriptWithoutArgs,
  randomSudtTypeScript,
} from "./utils";
import { testConfig } from "./lightGodwokenConfig";
import { BI, Script } from "@ckb-lumos/lumos";

let lightGodwokenV0: LightGodwokenV0;
let lightGodwokenV1: LightGodwokenV1;
let lightGodwokenProviderV0: DefaultLightGodwokenProvider;
let lightGodwokenProviderV1: DefaultLightGodwokenProvider;
beforeEach(() => {
  const ethAddress = "0x0C1EfCCa2Bcb65A532274f3eF24c044EF4ab6D73";
  const dummyEthereum = {
    on: () => {},
  };
  lightGodwokenProviderV1 = new DefaultLightGodwokenProvider(ethAddress, dummyEthereum, "v1", testConfig);
  lightGodwokenV1 = new LightGodwokenV1(lightGodwokenProviderV1);
  lightGodwokenProviderV0 = new DefaultLightGodwokenProvider(ethAddress, dummyEthereum, "v0", testConfig);
  lightGodwokenV0 = new LightGodwokenV0(lightGodwokenProviderV0);
});

type StubOptions = {
  version: "v0" | "v1";
  capacity: number;
  amount: number;
  type?: Script;
};

const stubCellCollector = (options: StubOptions) => {
  const lightGodwokenInstance = options.version === "v0" ? lightGodwokenV0 : lightGodwokenV1;
  const lightGodwokenProviderInstance = options.version === "v0" ? lightGodwokenProviderV0 : lightGodwokenProviderV1;
  const mockCell = generateCellInput(options.capacity);
  const sudtTypeWithoutArgs = sudtTypeScriptWithoutArgs(lightGodwokenInstance.getConfig());
  const mockCollector = { collect: sinon.stub().returns([mockCell]) };
  const mockFreeSudtCollector = { collect: sinon.stub().returns([]) };
  if (options.amount > 0 && !!options.type) {
    const mockSudtCell = generateCellInput(144, options.type, options.amount);
    const mockSudtCollector = { collect: sinon.stub().returns([mockSudtCell]) };
    sinon
      .stub(lightGodwokenProviderInstance.ckbIndexer, "collector")
      .withArgs({
        lock: lightGodwokenInstance.provider.getLayer1Lock(),
        type: "empty",
        outputDataLenRange: ["0x0", "0x1"],
      })
      .returns(mockCollector)
      .withArgs({
        lock: lightGodwokenInstance.provider.getLayer1Lock(),
        type: sudtTypeWithoutArgs,
      })
      .returns(mockFreeSudtCollector)
      .withArgs({
        lock: lightGodwokenInstance.provider.getLayer1Lock(),
        type: options.type,
      })
      .returns(mockSudtCollector);
  } else {
    sinon
      .stub(lightGodwokenProviderInstance.ckbIndexer, "collector")
      .withArgs({
        lock: lightGodwokenInstance.provider.getLayer1Lock(),
        type: "empty",
        outputDataLenRange: ["0x0", "0x1"],
      })
      .returns(mockCollector)
      .withArgs({
        lock: lightGodwokenInstance.provider.getLayer1Lock(),
        type: sudtTypeWithoutArgs,
      })
      .returns(mockFreeSudtCollector);
  }
};

describe("test light godwoken v1 deposit", () => {
  it("should generateDepositLock works fine", async () => {
    const lock = await lightGodwokenV1.generateDepositLock();
    expect(lock).toEqual({
      args: "0x702359ea7f073558921eb50d8c1c77e92f760c8f8656bde4995f26b8963e2dd8a900000014000000340000009d000000a50000003837aad0e28da55d366d62b7df9b1b0613c39c730c4c409b9722d4bed8cfa9266900000010000000300000003100000007521d0aa8e66ef441ebc31204d86bb23fc83e9edc58c19dbb1b0ebe64336ec00134000000702359ea7f073558921eb50d8c1c77e92f760c8f8656bde4995f26b8963e2dd80c1efcca2bcb65a532274f3ef24c044ef4ab6d73803a0900000000c002000000",
      code_hash: "0x50704b84ecb4c4b12b43c7acb260ddd69171c21b4c0ba15f3c469b7d143f6f18",
      hash_type: "type",
    });
  });
  it("should deposit 2000 ckb ok when user balance is 2000", async () => {
    stubCellCollector({ version: "v1", capacity: 2000, amount: 0 });
    const tx = await lightGodwokenV1.generateDepositTx({
      capacity: BI.from(2000).mul(BI.from(10).pow(8)).toHexString(),
    });

    expect(tx.outputs.get(0)?.cell_output.capacity).toEqual(BI.from(2000).mul(BI.from(10).pow(8)).toHexString());
    expect(outputCapacityOf(tx).toString()).toEqual("2000");
  });
  it("should deposit 2000 ckb fail when user balance is 1999", async () => {
    stubCellCollector({ version: "v1", capacity: 1999, amount: 0 });
    let errMsg = "";
    try {
      await lightGodwokenV1.generateDepositTx({ capacity: BI.from(2000).mul(BI.from(10).pow(8)).toHexString() });
    } catch (error) {
      errMsg = (error as any).message;
    }
    expect(errMsg).toEqual("Not enough CKB:expected: 206400000000, actual: 199900000000");
  });
  it("should deposit 2000 ckb fail when user balance is 2001", async () => {
    stubCellCollector({ version: "v1", capacity: 2001, amount: 0 });
    let errMsg = "";
    try {
      await lightGodwokenV1.generateDepositTx({ capacity: BI.from(2000).mul(BI.from(10).pow(8)).toHexString() });
    } catch (error) {
      errMsg = (error as any).message;
    }
    expect(errMsg).toEqual("Not enough CKB:expected: 206400000000, actual: 200100000000");
  });

  it("should deposit 2000 ckb and 2000 sudt ok when user ckb balance is 2000 and sudt balance 2000", async () => {
    const sudtType = randomSudtTypeScript(lightGodwokenV1.getConfig());
    stubCellCollector({ version: "v1", capacity: 2000, amount: 2000, type: sudtType });

    const tx = await lightGodwokenV1.generateDepositTx({
      capacity: BI.from(2000).mul(BI.from(10).pow(8)).toHexString(),
      sudtType,
      amount: BI.from(2000).mul(BI.from(10).pow(18)).toHexString(),
    });

    expect(outputCapacityOf(tx).toString()).toEqual("2144");
    expect(outputSudtAmountOf(tx).toString()).toEqual("2000");
  });

  it("should deposit 2000 ckb and 2000 sudt ok when user ckb balance is 2000 and sudt balance 1999", async () => {
    const sudtType = randomSudtTypeScript(lightGodwokenV1.getConfig());
    stubCellCollector({ version: "v1", capacity: 2000, amount: 1999, type: sudtType });

    let errMsg = "";
    try {
      await await lightGodwokenV1.generateDepositTx({
        capacity: BI.from(2000).mul(BI.from(10).pow(8)).toHexString(),
        sudtType,
        amount: BI.from(2000).mul(BI.from(10).pow(18)).toHexString(),
      });
    } catch (error) {
      errMsg = (error as any).message;
    }
    expect(errMsg).toEqual("Not enough SUDT:expected: 2000000000000000000000, actual: 1999000000000000000000");
  });
});

describe("test light godwoken v0 deposit", () => {
  it("should deposit 2000 ckb ok when user balance is 2000", async () => {
    stubCellCollector({ version: "v0", capacity: 2000, amount: 0 });
    const tx = await lightGodwokenV0.generateDepositTx({
      capacity: BI.from(2000).mul(BI.from(10).pow(8)).toHexString(),
    });

    expect(tx.outputs.get(0)?.cell_output.capacity).toEqual(BI.from(2000).mul(BI.from(10).pow(8)).toHexString());
    expect(outputCapacityOf(tx).toString()).toEqual("2000");
  });
  it("should deposit 2000 ckb fail when user balance is 1999", async () => {
    stubCellCollector({ version: "v0", capacity: 1999, amount: 0 });
    let errMsg = "";
    try {
      await lightGodwokenV0.generateDepositTx({ capacity: BI.from(2000).mul(BI.from(10).pow(8)).toHexString() });
    } catch (error) {
      errMsg = (error as any).message;
    }
    expect(errMsg).toEqual("Not enough CKB:expected: 206400000000, actual: 199900000000");
  });
  it("should deposit 2000 ckb fail when user balance is 2001", async () => {
    stubCellCollector({ version: "v0", capacity: 2001, amount: 0 });
    let errMsg = "";
    try {
      await lightGodwokenV0.generateDepositTx({ capacity: BI.from(2000).mul(BI.from(10).pow(8)).toHexString() });
    } catch (error) {
      errMsg = (error as any).message;
    }
    expect(errMsg).toEqual("Not enough CKB:expected: 206400000000, actual: 200100000000");
  });

  it("should deposit 2000 ckb and 2000 sudt ok when user ckb balance is 2000 and sudt balance 2000", async () => {
    const sudtType = randomSudtTypeScript(lightGodwokenV1.getConfig());
    stubCellCollector({ version: "v0", capacity: 2000, amount: 2000, type: sudtType });

    const tx = await lightGodwokenV0.generateDepositTx({
      capacity: BI.from(2000).mul(BI.from(10).pow(8)).toHexString(),
      sudtType,
      amount: BI.from(2000).mul(BI.from(10).pow(18)).toHexString(),
    });

    expect(outputCapacityOf(tx).toString()).toEqual("2144");
    expect(outputSudtAmountOf(tx).toString()).toEqual("2000");
  });

  it("should deposit 2000 ckb and 2000 sudt ok when user ckb balance is 2000 and sudt balance 1999", async () => {
    const sudtType = randomSudtTypeScript(lightGodwokenV1.getConfig());
    stubCellCollector({ version: "v0", capacity: 2000, amount: 1999, type: sudtType });

    let errMsg = "";
    try {
      await await lightGodwokenV0.generateDepositTx({
        capacity: BI.from(2000).mul(BI.from(10).pow(8)).toHexString(),
        sudtType,
        amount: BI.from(2000).mul(BI.from(10).pow(18)).toHexString(),
      });
    } catch (error) {
      errMsg = (error as any).message;
    }
    expect(errMsg).toEqual("Not enough SUDT:expected: 2000000000000000000000, actual: 1999000000000000000000");
  });
});
