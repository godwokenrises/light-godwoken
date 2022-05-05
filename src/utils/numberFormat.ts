import { BI } from "@ckb-lumos/lumos";

export const parseUnit = (value: string, unit: number = 0): BI => {
  const valueArray = value.split(".");
  if (valueArray.length === 2) {
    let result = BI.from(valueArray[0]).mul(BI.from(10).pow(unit));
    if (valueArray[1] !== "") {
      result = result.add(BI.from(valueArray[1]).mul(BI.from(10).pow(unit - valueArray[1].length)));
    }
    return result;
  } else if (valueArray.length === 1) {
    return BI.from(value).mul(BI.from(10).pow(unit));
  } else {
    throw new Error("input string format error");
  }
};
