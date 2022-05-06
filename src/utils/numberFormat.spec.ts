import { BI } from "@ckb-lumos/lumos";
import { parseStringToBI } from "./numberFormat";

describe("parseStringToBI", () => {
  it("parse number and float to BI", () => {
    expect(parseStringToBI("10", 2).toString()).toEqual(BI.from(1000).toString());
    expect(parseStringToBI("10.", 2).toString()).toEqual(BI.from(1000).toString());
    expect(parseStringToBI("10.01", 2).toString()).toEqual(BI.from(1001).toString());
  });
});
