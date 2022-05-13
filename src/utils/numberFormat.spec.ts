import { BI } from "@ckb-lumos/lumos";
import { parseStringToBI, formatToThousands } from "./numberFormat";

describe("parseStringToBI", () => {
  it("parse number and float to BI", () => {
    expect(parseStringToBI("10", 2).toString()).toEqual(BI.from(1000).toString());
    expect(parseStringToBI("10.", 2).toString()).toEqual(BI.from(1000).toString());
    expect(parseStringToBI("10.01", 2).toString()).toEqual(BI.from(1001).toString());
  });
});

describe("formatToThousands", () => {
  it("parse number to thousands format", () => {
    expect(formatToThousands("10")).toEqual("10");
    expect(formatToThousands("1000")).toEqual("1,000");
    expect(formatToThousands("1000.3323")).toEqual("1,000.3323");
  });
});
