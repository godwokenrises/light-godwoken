import { toHumanReadable, toUanType } from "../constants/tokens";

describe("test tokens.ts", () => {
  it("should transfer TTKN to UanType", async () => {
    const sampleUan = "TTKN";
    expect(toUanType(sampleUan)).toEqual([["TTKN", undefined]]);
    expect(toHumanReadable(sampleUan)).toEqual("TTKN");
  });
  it("should transfer uan to UanType", async () => {
    const sampleUan = "USDC.gw|gb.ckb|fb.eth";
    expect(toUanType(sampleUan)).toEqual([
      ["USDC", "gw"],
      ["gb", "ckb"],
      ["fb", "eth"],
    ]);
    expect(toHumanReadable(sampleUan)).toEqual(
      "USDC on Godwoken from Godwoken Bridge on CKB from Force Bridge on Ethereum",
    );
  });
});
