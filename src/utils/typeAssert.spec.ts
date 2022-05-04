import { BI } from "@ckb-lumos/lumos";
import { parseUnit } from "./numberFormat";

describe("parseUnit", () => {
  it("parse number and float to BI", () => {
    expect(parseUnit("10", 2).toString()).toEqual(BI.from(1000).toString());
    expect(parseUnit("10.01", 2).toString()).toEqual(BI.from(1001).toString());
  });
});
