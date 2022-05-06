import { parseUnit } from "./numberFormat";

export const isSudtInputValidate = (sudtValue: string, sudtBalance?: string, decimal?: number) => {
  if (sudtValue === "0" || sudtValue === "") {
    return true;
  }
  if (sudtValue && sudtBalance && parseUnit(sudtBalance).gte(parseUnit(sudtValue, decimal))) {
    return true;
  } else {
    return false;
  }
};

export const isCKBInputValidate = (CKBInput: string, CKBBalance?: string) => {
  if (CKBInput === "" || CKBBalance === undefined) {
    return false;
  } else if (parseUnit(CKBInput, 8).gte(parseUnit("400", 8)) && parseUnit(CKBInput, 8).lte(parseUnit(CKBBalance))) {
    return true;
  } else {
    return false;
  }
};
type InputType = {
  CKBInput: string;
  CKBBalance: string | undefined;
  sudtValue: string;
  sudtBalance: string | undefined;
  sudtDecimals: number | undefined;
  sudtSymbol: string | undefined;
};

/**
 * check if the input is valid,
 * if it is valid, return undefined
 * if it is invalid, return an error message
 */
export const getInputError = ({
  CKBInput,
  CKBBalance,
  sudtValue,
  sudtBalance,
  sudtDecimals,
  sudtSymbol,
}: InputType): string | undefined => {
  if (CKBInput === "") {
    return "Enter CKB Amount";
  }
  if (parseUnit(CKBInput, 8).lt(parseUnit("400", 8))) {
    return "Minimum 400 CKB";
  }
  if (CKBBalance && parseUnit(CKBInput, 8).gt(parseUnit(CKBBalance))) {
    return "Insufficient CKB Amount";
  }
  if (sudtValue && sudtBalance && parseUnit(sudtValue, sudtDecimals).gt(parseUnit(sudtBalance))) {
    return `Insufficient ${sudtSymbol} Amount`;
  }
  return undefined;
};

export const isDepositCKBInputValidate = (CKBInput: string, CKBBalance?: string) => {
  if (CKBInput === "" || CKBBalance === undefined) {
    return false;
  }
  if (isCKBInputValidate(CKBInput, CKBBalance)) {
    // must deposit max or left at least 64 ckb
    if (
      parseUnit(CKBInput, 8).eq(parseUnit(CKBBalance)) ||
      parseUnit(CKBBalance).sub(parseUnit(CKBInput, 8)).gte(parseUnit("64", 8))
    ) {
      return true;
    }
  }
  return false;
};

export const getDepositInputError = ({
  CKBInput,
  CKBBalance,
  sudtValue,
  sudtBalance,
  sudtDecimals,
  sudtSymbol,
}: InputType): string | undefined => {
  if (CKBInput === "") {
    return "Enter CKB Amount";
  }
  if (parseUnit(CKBInput, 8).lt(parseUnit("400", 8))) {
    return "Minimum 400 CKB";
  }
  if (CKBBalance && parseUnit(CKBInput, 8).gt(parseUnit(CKBBalance))) {
    return "Insufficient CKB Amount";
  }
  // must deposit max or left at least 64 ckb
  if (
    CKBBalance &&
    parseUnit(CKBBalance).gte(parseUnit("64", 8)) &&
    parseUnit(CKBInput, 8).gt(parseUnit(CKBBalance).sub(parseUnit("64", 8))) &&
    parseUnit(CKBInput, 8).lt(parseUnit(CKBBalance))
  ) {
    return "Must Left 0 Or 64 More CKB";
  }
  if (sudtValue && sudtBalance && parseUnit(sudtValue, sudtDecimals).gt(parseUnit(sudtBalance))) {
    return `Insufficient ${sudtSymbol} Amount`;
  }
  return undefined;
};
