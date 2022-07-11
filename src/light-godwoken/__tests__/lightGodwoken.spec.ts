import LightGodwokenV1 from "../LightGodwokenV1";
import DefaultLightGodwokenProvider from "../lightGodwokenProvider";
import { generateCellInput, randomHexString } from "./utils";
import { testConfig } from "./lightGodwokenConfig";
import { BI, Cell, Script } from "@ckb-lumos/lumos";

let lightGodwokenV1: LightGodwokenV1;
let lightGodwokenProviderV1: DefaultLightGodwokenProvider;
beforeEach(() => {
  const ethAddress = "0x0C1EfCCa2Bcb65A532274f3eF24c044EF4ab6D73";
  const dummyEthereum = {
    on: () => {},
  };
  lightGodwokenProviderV1 = new DefaultLightGodwokenProvider(ethAddress, dummyEthereum, "v1", testConfig);
  lightGodwokenV1 = new LightGodwokenV1(lightGodwokenProviderV1);
});

describe("test light godwoken generateDepositOutputCell", () => {
  it("should deposit 400 CKB", async () => {
    const collectedCells: Cell[] = [generateCellInput(400)];
    const outputCells = await lightGodwokenV1.generateDepositOutputCell(collectedCells, [], {
      capacity: BI.from(400_00000000).toHexString(),
    });
    expect(outputCells.length).toEqual(1);
    expect(outputCells[0].cell_output.capacity).toEqual(BI.from(400_00000000).toHexString());
  });
  it("should deposit 400 CKB, 300 pure CKB and 100 free CKB", async () => {
    const typeScript: Script = {
      code_hash: lightGodwokenV1.getConfig().layer1Config.SCRIPTS.sudt.code_hash,
      hash_type: lightGodwokenV1.getConfig().layer1Config.SCRIPTS.sudt.hash_type,
      args: randomHexString(32),
    };
    const collectedCells: Cell[] = [generateCellInput(300)];
    const freeCKBCells: Cell[] = [generateCellInput(144 + 100, typeScript, 1)];
    const outputCells = await lightGodwokenV1.generateDepositOutputCell(collectedCells, freeCKBCells, {
      capacity: BI.from(400_00000000).toHexString(),
    });
    expect(outputCells.length).toEqual(2);
    expect(outputCells[0].cell_output.capacity).toEqual(BI.from(144_00000000).toHexString());
    expect(outputCells[0].cell_output.type).toEqual(typeScript);
    expect(outputCells[1].cell_output.capacity).toEqual(BI.from(400_00000000).toHexString());
  });
  it("should deposit 400 CKB, 250 pure CKB and 100 from free CKB and 50 from sudt cell", async () => {
    const freeTypeScript: Script = {
      code_hash: lightGodwokenV1.getConfig().layer1Config.SCRIPTS.sudt.code_hash,
      hash_type: lightGodwokenV1.getConfig().layer1Config.SCRIPTS.sudt.hash_type,
      args: randomHexString(32),
    };
    const depositSudtTypeScript: Script = {
      code_hash: lightGodwokenV1.getConfig().layer1Config.SCRIPTS.sudt.code_hash,
      hash_type: lightGodwokenV1.getConfig().layer1Config.SCRIPTS.sudt.hash_type,
      args: randomHexString(32),
    };
    const pureCKBCells: Cell[] = [generateCellInput(250)];
    const freeCKBCells: Cell[] = [generateCellInput(144 + 100, freeTypeScript, 1)];
    const sudtCells: Cell[] = [generateCellInput(144 + 50, depositSudtTypeScript, 2)];
    const outputCells = await lightGodwokenV1.generateDepositOutputCell([...pureCKBCells, ...sudtCells], freeCKBCells, {
      capacity: BI.from(400_00000000).toHexString(),
      amount: BI.from(2).mul(1000000000000000000).toHexString(),
      sudtType: depositSudtTypeScript,
    });
    expect(outputCells.length).toEqual(3);
    // output 0 is free ckb provider cell after taken free ckb away
    expect(outputCells[0].cell_output.capacity).toEqual(BI.from(144_00000000).toHexString());
    expect(outputCells[0].cell_output.type).toEqual(freeTypeScript);
    // output 1 is deposit cell
    expect(outputCells[1].cell_output.capacity).toEqual(BI.from(400_00000000).toHexString());
    expect(outputCells[1].cell_output.type).toEqual(depositSudtTypeScript);
    // output 2 is exchangecell
    expect(outputCells[2].cell_output.capacity).toEqual(BI.from(144_00000000).toHexString());
    expect(outputCells[2].cell_output.type).toEqual(undefined);
    expect(outputCells[2].cell_output.lock).toEqual(lightGodwokenV1.provider.getLayer1Lock());
  });
});
