import { BI } from "@ckb-lumos/lumos";
import numeral from "numeral";

export const parseStringToBI = (value: string, decimals: number = 0): BI => {
  const valueArray = value.split(".");
  if (valueArray.length === 2) {
    let result = BI.from(valueArray[0]).mul(BI.from(10).pow(decimals));
    if (valueArray[1] !== "") {
      result = result.add(BI.from(valueArray[1]).mul(BI.from(10).pow(decimals - valueArray[1].length)));
    }
    return result;
  } else if (valueArray.length === 1) {
    return BI.from(value).mul(BI.from(10).pow(decimals));
  } else {
    throw new Error("input string format error");
  }
};

export const formatToThousands = (value: string) => {
  let format = "0,0";
  if (value.split(".").length === 2) {
    return numeral(value.split(".")[0]).format(format) + "." + value.split(".")[1];
  }
  return numeral(value).format(format);
};
