import { parse, translate } from "../tokens/uan";

describe("test tokens.ts", () => {
  it("should transfer TTKN to UanType", async () => {
    let errMsg = "";
    try {
      parse("TTKN");
    } catch (error) {
      errMsg = (error as any).message;
    }
    expect(errMsg).toEqual("Invalid UAN: TTKN");
    expect(parse("TTKN.ckb")).toEqual({ asset: { assetSymbol: "TTKN", chainSymbol: "ckb" }, route: [] });
  });
  it("should transfer uan to UanType", async () => {
    const sampleUan = "USDC.gw|gb.ckb|fb.eth";
    expect(parse(sampleUan)).toEqual({
      asset: { assetSymbol: "USDC", chainSymbol: "gw" },
      route: [
        { bridgeSymbol: "gb", chainSymbol: "ckb" },
        { bridgeSymbol: "fb", chainSymbol: "eth" },
      ],
    });
    expect(translate(sampleUan)).toEqual("USDC(via Force Bridge from Ethereum)");
  });
});
