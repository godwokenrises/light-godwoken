import { Address, BI } from "@ckb-lumos/lumos";
import { parseAddress } from "@ckb-lumos/helpers";
import { parseStringToBI } from "./numberFormat";
import { LightGodwokenConfig } from "light-godwoken";

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

export interface L1TransferInputParams {
  ckbValue: string;
  ckbBalance?: string;
  sudtValue: string;
  sudtBalance?: string;
  sudtDecimals?: number;
  sudtSymbol?: string;
  senderAddress: Address;
  recipientAddress: Address;
  config: LightGodwokenConfig;
}

export const getL1TransferInputError = (params: L1TransferInputParams): string | undefined => {
  const minCkbCell = "63";
  const minCkbCellShannons = parseStringToBI(minCkbCell, 8);
  const minCkbCellWithFee = "64";
  const minCkbCellWithFeeShannons = parseStringToBI(minCkbCellWithFee, 8);
  const minSudtCell = "144";
  const minSudtCellShannons = parseStringToBI(minSudtCell, 8);

  const ckbAmount = parseStringToBI(params.ckbValue || "0", 8);
  const ckbBalance = parseStringToBI(params.ckbBalance || "0");
  if (!params.ckbValue && !params.sudtValue) {
    return `Enter Transfer Amount`;
  }
  if (params.ckbValue && ckbAmount.lt(minCkbCellShannons)) {
    return `Minimum ${minCkbCell} CKB`;
  }
  if (ckbBalance.lt(ckbAmount.add(minCkbCellWithFeeShannons))) {
    return `Balance Less Than ${minCkbCellWithFee} CKB`;
  }

  const sudtAmount = parseStringToBI(params.sudtValue || "0", params.sudtDecimals);
  const sudtBalance = parseStringToBI(params.sudtBalance || "0");
  const sudtLeft = sudtBalance.sub(sudtAmount);
  if (params.sudtValue && sudtAmount.lte(0)) {
    return `Enter An Amount`;
  }
  if (params.sudtValue && sudtAmount.gt(sudtBalance)) {
    return `Insufficient ${params.sudtSymbol} Amount`;
  }

  const minSudtExchange = BI.from(minCkbCellWithFee).add(minSudtCell);
  const minSudtExchangeShannons = minCkbCellWithFeeShannons.add(minSudtCellShannons);
  if (params.sudtValue && sudtLeft.gt(0) && ckbBalance.lt(minSudtExchangeShannons)) {
    return `Balance Less Than ${minSudtExchange.toString()} CKB`;
  }

  const hasAmount = params.ckbValue || params.sudtValue;
  const recipient = params.recipientAddress.trim();
  const sender = params.senderAddress.trim();
  if (hasAmount && !recipient) {
    return "Enter Recipient Address";
  }
  try {
    parseAddress(recipient, {
      config: params.config.lumosConfig,
    });
  } catch {
    return "Invalid CKB Address";
  }
  if (hasAmount && recipient === sender) {
    return "Unsupported Self Transfer";
  }

  return undefined;
};
