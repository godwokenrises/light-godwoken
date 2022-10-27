import sinon from "sinon";
import LightGodwokenV1 from "../LightGodwokenV1";
import DefaultLightGodwokenProvider from "../lightGodwokenProvider";
import {
  generateCellInput,
  inputCapacityOf,
  outputCapacityOf,
  randomSudtTypeScript,
  randomSudtTypeScriptWithoutArgs,
} from "./utils";
import { BI, Cell, Script } from "@ckb-lumos/lumos";
import { createLightGodwoken } from "./client";
import { GodwokenNetwork, GodwokenVersion } from "../config";

let lightGodwokenV1: LightGodwokenV1;
let lightGodwokenProviderV1: DefaultLightGodwokenProvider;
beforeEach(() => {
  const ethAddress = "0x0C1EfCCa2Bcb65A532274f3eF24c044EF4ab6D73";
  lightGodwokenV1 = createLightGodwoken(ethAddress, GodwokenNetwork.Testnet, GodwokenVersion.V1);
  lightGodwokenProviderV1 = lightGodwokenV1.provider;
});

describe("test light godwoken generateDepositOutputCell", () => {
  it("should deposit 400 CKB", async () => {
    const collectedCells: Cell[] = [generateCellInput(400)];
    const outputCells = await lightGodwokenV1.generateDepositOutputCell(collectedCells, [], {
      capacity: BI.from(400e8).toHexString(),
    });
    expect(outputCells.length).toEqual(1);
    expect(outputCells[0].cell_output.capacity).toEqual(BI.from(400e8).toHexString());
  });
  it("should deposit 400 CKB, 300 pure CKB and 100 free CKB", async () => {
    const typeScript: Script = randomSudtTypeScript(lightGodwokenV1.getConfig());
    const collectedCells: Cell[] = [generateCellInput(300)];
    const freeCKBCells: Cell[] = [generateCellInput(144 + 100, typeScript, 1)];
    const outputCells = await lightGodwokenV1.generateDepositOutputCell(collectedCells, freeCKBCells, {
      capacity: BI.from(400e8).toHexString(),
    });
    const [sudtExchangeCell, depositCell] = outputCells;
    expect(outputCells.length).toEqual(2);
    expect(sudtExchangeCell.cell_output.capacity).toEqual(BI.from(144e8).toHexString());
    expect(sudtExchangeCell.cell_output.type).toEqual(typeScript);
    expect(depositCell.cell_output.capacity).toEqual(BI.from(400e8).toHexString());
  });
  it("should deposit 400 CKB, 250 pure CKB and 100 from free CKB and 50 from sudt cell", async () => {
    const freeTypeScript: Script = randomSudtTypeScript(lightGodwokenV1.getConfig());
    const depositSudtTypeScript: Script = randomSudtTypeScript(lightGodwokenV1.getConfig());
    const pureCKBCells: Cell[] = [generateCellInput(250)];
    const sudtCells: Cell[] = [generateCellInput(144 + 50, depositSudtTypeScript, 2)];
    const freeCKBCells: Cell[] = [generateCellInput(144 + 100, freeTypeScript, 1)];
    const outputCells = await lightGodwokenV1.generateDepositOutputCell([...pureCKBCells, ...sudtCells], freeCKBCells, {
      capacity: BI.from(400e8).toHexString(),
      amount: BI.from(2).mul(BI.from(10).pow(18)).toHexString(),
      sudtType: depositSudtTypeScript,
    });
    const [sudtExchangeCell, depositCell, ckbExchangeCell] = outputCells;
    expect(outputCells.length).toEqual(3);
    // output 0 is free ckb provider cell after taken free ckb away
    expect(sudtExchangeCell.cell_output.capacity).toEqual(BI.from(144e8).toHexString());
    expect(sudtExchangeCell.cell_output.type).toEqual(freeTypeScript);
    // output 1 is deposit cell
    expect(depositCell.cell_output.capacity).toEqual(BI.from(400e8).toHexString());
    expect(depositCell.cell_output.type).toEqual(depositSudtTypeScript);
    // output 2 is exchangecell
    expect(ckbExchangeCell.cell_output.capacity).toEqual(BI.from(144e8).toHexString());
    expect(ckbExchangeCell.cell_output.type).toEqual(undefined);
    expect(ckbExchangeCell.cell_output.lock).toEqual(lightGodwokenV1.provider.getLayer1Lock());
  });
  it("should generateDepositTx if user deposit 400 CKB, and user has 250 pure CKB and 100 from free CKB and 50 from sudt cell", async () => {
    const freeTypeScript: Script = randomSudtTypeScript(lightGodwokenV1.getConfig());
    const depositSudtTypeScript: Script = randomSudtTypeScript(lightGodwokenV1.getConfig());
    const mockCell = generateCellInput(250);
    const sudtTypeWithoutArgs = randomSudtTypeScriptWithoutArgs(lightGodwokenV1.getConfig());
    const sudtCells: Cell[] = [generateCellInput(144 + 50, depositSudtTypeScript, 2)];
    const freeCKBCells: Cell[] = [generateCellInput(144 + 100, freeTypeScript, 1)];
    const mockCollector = { collect: sinon.stub().returns([mockCell]) };
    const mockSudtCollector = { collect: sinon.stub().returns([...sudtCells]) };
    const mockFreeSudtCollector = { collect: sinon.stub().returns([...sudtCells, ...freeCKBCells]) };
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
        type: sudtTypeWithoutArgs,
        outputDataLenRange: ["0x10", "0x11"],
      })
      .returns(mockFreeSudtCollector)
      .withArgs({
        lock: lightGodwokenV1.provider.getLayer1Lock(),
        type: depositSudtTypeScript,
        outputDataLenRange: ["0x10", "0x11"],
      })
      .returns(mockSudtCollector);

    const tx = await lightGodwokenV1.generateDepositTx({
      capacity: BI.from(400e8).toHexString(),
      amount: BI.from(1).mul(BI.from(10).pow(18)).toHexString(),
      sudtType: depositSudtTypeScript,
    });

    expect(outputCapacityOf(tx).toString()).toEqual(String(250 + 144 + 50 + 144 + 100));
    expect(inputCapacityOf(tx).toString()).toEqual(String(250 + 144 + 50 + 144 + 100));
    expect(tx.cellDeps.toArray().length).toEqual(3);
  });
});
