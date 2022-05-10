import { BI } from "@ckb-lumos/lumos";
import { parseStringToBI } from "./numberFormat";

export const isSudtInputValidate = (sudtValue: string, sudtBalance?: string, decimal?: number) => {
  if (sudtValue === "0" || sudtValue === "") {
    return true;
  }
  if (sudtValue && sudtBalance && parseStringToBI(sudtBalance).gte(parseStringToBI(sudtValue, decimal))) {
    return true;
  } else {
    return false;
  }
};

export const isCKBInputValidate = (
  CKBInput: string,
  CKBBalance: string,
  limit: InputOptionType = { minimumCKBAmount: 400 },
) => {
  if (!CKBInput || !CKBBalance) {
    return false;
  } else if (
    parseStringToBI(CKBInput, 8).gte(BI.from(limit.minimumCKBAmount).mul(BI.from(10).pow(8))) &&
    parseStringToBI(CKBInput, limit.decimals || 8).lte(parseStringToBI(CKBBalance))
  ) {
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
type InputOptionType = {
  minimumCKBAmount: number;
  decimals?: number;
};

/**
 * check if the input is valid,
 * if it is valid, return undefined
 * if it is invalid, return an error message
 */
export const getInputError = (
  { CKBInput, CKBBalance, sudtValue, sudtBalance, sudtDecimals, sudtSymbol }: InputType,
  limit: InputOptionType = { minimumCKBAmount: 400 },
): string | undefined => {
  if (CKBInput === "") {
    return "Enter CKB Amount";
  }
  if (parseStringToBI(CKBInput, 8).lt(BI.from(limit.minimumCKBAmount).mul(BI.from(10).pow(8)))) {
    return `Minimum ${limit.minimumCKBAmount} CKB`;
  }
  if (CKBBalance && parseStringToBI(CKBInput, 8).gt(parseStringToBI(CKBBalance))) {
    return "Insufficient CKB Amount";
  }
  if (sudtValue && sudtBalance && parseStringToBI(sudtValue, sudtDecimals).gt(parseStringToBI(sudtBalance))) {
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
      parseStringToBI(CKBInput, 8).eq(parseStringToBI(CKBBalance)) ||
      parseStringToBI(CKBBalance).sub(parseStringToBI(CKBInput, 8)).gte(parseStringToBI("64", 8))
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
  const commonInputError = getInputError({
    CKBInput,
    CKBBalance,
    sudtValue,
    sudtBalance,
    sudtDecimals,
    sudtSymbol,
  });
  if (commonInputError !== undefined) {
    return commonInputError;
  } else if (
    // must deposit max or left at least 64 ckb
    CKBBalance &&
    parseStringToBI(CKBBalance).gte(parseStringToBI("64", 8)) &&
    parseStringToBI(CKBInput, 8).gt(parseStringToBI(CKBBalance).sub(parseStringToBI("64", 8))) &&
    parseStringToBI(CKBInput, 8).lt(parseStringToBI(CKBBalance))
  ) {
    return "Must Left 0 Or 64 More CKB";
  }
  return undefined;
};
