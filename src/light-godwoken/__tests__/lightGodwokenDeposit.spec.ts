import sinon from "sinon";
import LightGodwokenV1 from "../LightGodwokenV1";
import LightGodwokenV0 from "../LightGodwokenV0";
import DefaultLightGodwokenProvider from "../lightGodwokenProvider";
import { generateCellInput, outputCapacityOf, randomScript, outputSudtAmountOf } from "./utils";
import { testConfig } from "./lightGodwokenConfig";

let lightGodwokenV0: LightGodwokenV0;
let lightGodwokenV1: LightGodwokenV1;
let lightGodwokenProviderV0: DefaultLightGodwokenProvider;
let lightGodwokenProviderV1: DefaultLightGodwokenProvider;
sinon.stub(LightGodwokenV1.prototype, "updateConfigViaRpc").returns(Promise.resolve());
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
    const mockCell = generateCellInput(2000);

    const mockCollector = { collect: sinon.stub().returns([mockCell]) };
    sinon.stub(lightGodwokenProviderV1.ckbIndexer, "collector").returns(mockCollector);
    const tx = await lightGodwokenV1.generateDepositTx({ capacity: "0x2e90edd000" });

    expect(tx.outputs.get(0)?.cell_output.capacity).toEqual("0x2e90edd000");
    expect(outputCapacityOf(tx).toString()).toEqual("2000");
  });
  it("should deposit 2000 ckb fail when user balance is 1999", async () => {
    const mockCell = generateCellInput(1999);

    const mockCollector = { collect: sinon.stub().returns([mockCell]) };
    sinon.stub(lightGodwokenProviderV1.ckbIndexer, "collector").returns(mockCollector);
    let errMsg = "";
    try {
      await lightGodwokenV1.generateDepositTx({ capacity: "0x2e90edd000" });
    } catch (error) {
      errMsg = (error as any).message;
    }
    expect(errMsg).toEqual("Not enough CKB:expected: 206400000000, actual: 199900000000");
  });
  it("should deposit 2000 ckb fail when user balance is 2001", async () => {
    const mockCell = generateCellInput(2001);

    const mockCollector = { collect: sinon.stub().returns([mockCell]) };
    sinon.stub(lightGodwokenProviderV1.ckbIndexer, "collector").returns(mockCollector);
    let errMsg = "";
    try {
      await lightGodwokenV1.generateDepositTx({ capacity: "0x2e90edd000" });
    } catch (error) {
      errMsg = (error as any).message;
    }
    expect(errMsg).toEqual("Not enough CKB:expected: 206400000000, actual: 200100000000");
  });

  it("should deposit 2000 ckb and 2000 sudt ok when user ckb balance is 2000 and sudt balance 2000", async () => {
    const sudtType = randomScript(32);
    const mockCkbCell = generateCellInput(2000);
    const mockSudtCell = generateCellInput(144, sudtType, 2000);

    const mockCollector = {
      collect: sinon.stub().returns([mockCkbCell]),
    };
    const mockSudtCollector = {
      collect: sinon.stub().returns([mockSudtCell]),
    };

    sinon
      .stub(lightGodwokenProviderV1.ckbIndexer, "collector")
      .withArgs({
        lock: lightGodwokenV1.provider.getLayer1Lock(),
        type: "empty",
        outputDataLenRange: ["0x0", "0x1"],
      })
      .returns(mockCollector)
      .withArgs({
        lock: lightGodwokenV1.provider.getLayer1Lock(),
        type: sudtType,
      })
      .returns(mockSudtCollector);

    const tx = await lightGodwokenV1.generateDepositTx({
      capacity: "0x2e90edd000",
      sudtType,
      amount: "0x6c6b935b8bbd400000",
    });

    expect(outputCapacityOf(tx).toString()).toEqual("2144");
    expect(outputSudtAmountOf(tx).toString()).toEqual("2000");
  });

  it("should deposit 2000 ckb and 2000 sudt ok when user ckb balance is 2000 and sudt balance 1999", async () => {
    const sudtType = randomScript(32);
    const mockCkbCell = generateCellInput(2000);
    const mockSudtCell = generateCellInput(144, sudtType, 1999);

    const mockCollector = {
      collect: sinon.stub().returns([mockCkbCell]),
    };
    const mockSudtCollector = {
      collect: sinon.stub().returns([mockSudtCell]),
    };

    sinon
      .stub(lightGodwokenProviderV1.ckbIndexer, "collector")
      .withArgs({
        lock: lightGodwokenV1.provider.getLayer1Lock(),
        type: "empty",
        outputDataLenRange: ["0x0", "0x1"],
      })
      .returns(mockCollector)
      .withArgs({
        lock: lightGodwokenV1.provider.getLayer1Lock(),
        type: sudtType,
      })
      .returns(mockSudtCollector);

    let errMsg = "";
    try {
      await await lightGodwokenV1.generateDepositTx({
        capacity: "0x2e90edd000",

        sudtType,
        amount: "0x6c6b935b8bbd400000",
      });
    } catch (error) {
      errMsg = (error as any).message;
    }
    expect(errMsg).toEqual("Not enough SUDT:expected: 2000000000000000000000, actual: 1999000000000000000000");
  });
});

describe("test light godwoken v0 deposit", () => {
  it("should deposit 2000 ckb ok when user balance is 2000", async () => {
    const mockCell = generateCellInput(2000);

    const mockCollector = { collect: sinon.stub().returns([mockCell]) };
    sinon.stub(lightGodwokenProviderV0.ckbIndexer, "collector").returns(mockCollector);
    const tx = await lightGodwokenV0.generateDepositTx({ capacity: "0x2e90edd000" });

    expect(tx.outputs.get(0)?.cell_output.capacity).toEqual("0x2e90edd000");
    expect(outputCapacityOf(tx).toString()).toEqual("2000");
  });
  it("should deposit 2000 ckb fail when user balance is 1999", async () => {
    const mockCell = generateCellInput(1999);

    const mockCollector = { collect: sinon.stub().returns([mockCell]) };
    sinon.stub(lightGodwokenProviderV0.ckbIndexer, "collector").returns(mockCollector);
    let errMsg = "";
    try {
      await lightGodwokenV0.generateDepositTx({ capacity: "0x2e90edd000" });
    } catch (error) {
      errMsg = (error as any).message;
    }
    expect(errMsg).toEqual("Not enough CKB:expected: 206400000000, actual: 199900000000");
  });
  it("should deposit 2000 ckb fail when user balance is 2001", async () => {
    const mockCell = generateCellInput(2001);

    const mockCollector = { collect: sinon.stub().returns([mockCell]) };
    sinon.stub(lightGodwokenProviderV0.ckbIndexer, "collector").returns(mockCollector);
    let errMsg = "";
    try {
      await lightGodwokenV0.generateDepositTx({ capacity: "0x2e90edd000" });
    } catch (error) {
      errMsg = (error as any).message;
    }
    expect(errMsg).toEqual("Not enough CKB:expected: 206400000000, actual: 200100000000");
  });

  it("should deposit 2000 ckb and 2000 sudt ok when user ckb balance is 2000 and sudt balance 2000", async () => {
    const sudtType = randomScript(32);
    const mockCkbCell = generateCellInput(2000);
    const mockSudtCell = generateCellInput(144, sudtType, 2000);

    const mockCollector = {
      collect: sinon.stub().returns([mockCkbCell]),
    };
    const mockSudtCollector = {
      collect: sinon.stub().returns([mockSudtCell]),
    };

    sinon
      .stub(lightGodwokenProviderV0.ckbIndexer, "collector")
      .withArgs({
        lock: lightGodwokenV0.provider.getLayer1Lock(),
        type: "empty",
        outputDataLenRange: ["0x0", "0x1"],
      })
      .returns(mockCollector)
      .withArgs({
        lock: lightGodwokenV0.provider.getLayer1Lock(),
        type: sudtType,
      })
      .returns(mockSudtCollector);

    const tx = await lightGodwokenV0.generateDepositTx({
      capacity: "0x2e90edd000",
      sudtType,
      amount: "0x6c6b935b8bbd400000",
    });

    expect(outputCapacityOf(tx).toString()).toEqual("2144");
    expect(outputSudtAmountOf(tx).toString()).toEqual("2000");
  });

  it("should deposit 2000 ckb and 2000 sudt ok when user ckb balance is 2000 and sudt balance 1999", async () => {
    const sudtType = randomScript(32);
    const mockCkbCell = generateCellInput(2000);
    const mockSudtCell = generateCellInput(144, sudtType, 1999);

    const mockCollector = {
      collect: sinon.stub().returns([mockCkbCell]),
    };
    const mockSudtCollector = {
      collect: sinon.stub().returns([mockSudtCell]),
    };

    sinon
      .stub(lightGodwokenProviderV0.ckbIndexer, "collector")
      .withArgs({
        lock: lightGodwokenV0.provider.getLayer1Lock(),
        type: "empty",
        outputDataLenRange: ["0x0", "0x1"],
      })
      .returns(mockCollector)
      .withArgs({
        lock: lightGodwokenV0.provider.getLayer1Lock(),
        type: sudtType,
      })
      .returns(mockSudtCollector);

    let errMsg = "";
    try {
      await await lightGodwokenV0.generateDepositTx({
        capacity: "0x2e90edd000",
        sudtType,
        amount: "0x6c6b935b8bbd400000",
      });
    } catch (error) {
      errMsg = (error as any).message;
    }
    expect(errMsg).toEqual("Not enough SUDT:expected: 2000000000000000000000, actual: 1999000000000000000000");
  });
});
