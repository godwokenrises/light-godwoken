import { Amount } from "@ckitjs/ckit/dist/helpers/Amount";

export const isSudtInputValidate = (sudtValue: string, sudtBalance?: string, decimal?: number) => {
  if (sudtValue === "0" || sudtValue === "") {
    return true;
  }
  if (sudtValue && sudtBalance && Amount.from(sudtBalance).gte(Amount.from(sudtValue, decimal))) {
    return true;
  } else {
    return false;
  }
};

export const isCKBInputValidate = (CKBInput: string, CKBBalance?: string) => {
  if (CKBInput === "" || CKBBalance === undefined) {
    return false;
  } else if (
    Amount.from(CKBInput, 8).gte(Amount.from(400, 8)) &&
    Amount.from(CKBInput, 8).lte(Amount.from(CKBBalance))
  ) {
    return true;
  } else {
    return false;
  }
};

export const getInputError = (
  CKBInput: string,
  CKBBalance: string | undefined,
  sudtValue: string,
  sudtBalance: string | undefined,
  sudtDecimals: number | undefined,
  sudtSymbol: string | undefined,
) => {
  if (CKBInput === "") {
    return "Enter CKB Amount";
  }
  if (Amount.from(CKBInput, 8).lt(Amount.from(400, 8))) {
    return "Minimum 400 CKB";
  }
  if (CKBBalance && Amount.from(CKBInput, 8).gt(Amount.from(CKBBalance))) {
    return "Insufficient CKB Amount";
  }
  if (sudtValue && sudtBalance && Amount.from(sudtValue, sudtDecimals).gt(Amount.from(sudtBalance))) {
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
      Amount.from(CKBInput, 8).eq(Amount.from(CKBBalance)) ||
      Amount.from(CKBBalance).minus(Amount.from(CKBInput, 8)).gte(Amount.from(64, 8))
    ) {
      return true;
    }
  }
  return false;
};
export const getDepositInputError = (
  CKBInput: string,
  CKBBalance: string | undefined,
  sudtValue: string,
  sudtBalance: string | undefined,
  sudtDecimals: number | undefined,
  sudtSymbol: string | undefined,
) => {
  if (CKBInput === "") {
    return "Enter CKB Amount";
  }
  if (Amount.from(CKBInput, 8).lt(Amount.from(400, 8))) {
    return "Minimum 400 CKB";
  }
  if (CKBBalance && Amount.from(CKBInput, 8).gt(Amount.from(CKBBalance))) {
    return "Insufficient CKB Amount";
  }
  // must deposit max or left at least 64 ckb
  if (
    CKBBalance &&
    Amount.from(CKBBalance).gte(Amount.from(64, 8)) &&
    Amount.from(CKBInput, 8).gt(Amount.from(CKBBalance).minus(Amount.from(64, 8))) &&
    Amount.from(CKBInput, 8).lt(Amount.from(CKBBalance))
  ) {
    return "Must Left 0 Or 64 More CKB";
  }
  if (sudtValue && sudtBalance && Amount.from(sudtValue, sudtDecimals).gt(Amount.from(sudtBalance))) {
    return `Insufficient ${sudtSymbol} Amount`;
  }
  return undefined;
};
