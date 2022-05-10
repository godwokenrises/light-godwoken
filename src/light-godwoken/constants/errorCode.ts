export const ErrorCode = {
  SUCCESS: 0,
  NETWORK_ERROR: 1,
  ETHEREUM_NOT_FOUND: 2,
  LIGHT_GODWOKEN_INVALID: 3,
  LAYER_1_RPC_ERROR: 101,
  LAYER_1_CKB_NOT_ENOUGH: 102,
  LAYER_1_SUDT_NOT_ENOUGH: 103,
  LAYER_2_RPC_ERROR: 201,
  LAYER_2_CKB_NOT_ENOUGH: 202,
  LAYER_2_ERC20_NOT_ENOUGH: 203,
  ETH_ADDRESS_FORMAT_ERROR: 301,
  LAYER_2_ACCOUNT_ID_NOT_FOUND: 302,
  WITHDRAWAL_CKB_LESS_THAN_LIMIT: 303,
  ERC20_TOKEN_NOT_FOUND: 304,
  TX_SIGN_ERROR: 305,
};

export const ErrorCodeMessage = {
  0: "Success",
  1: "Network error",
  2: "Ethereum not found",
  3: "Light Godwoken invalid",
  101: "Layer 1 RPC error",
  102: "Layer 1 CKB not enough",
  103: "Layer 1 SUDT not enough",
  201: "Layer 2 RPC error",
  202: "Layer 2 CKB not enough",
  203: "Layer 2 ERC20 not enough",
  301: "Eth address format error",
  302: "Account id not found",
  303: "Withdrawal ckb less than limit",
  304: "Erc20 token not found",
  305: "Tx sign error",
};

type ErrorCodeMessageType = typeof ErrorCodeMessage;

export type ErrorCodeType = keyof ErrorCodeMessageType;

type ErrorMessageMetadata = {
  expected: string;
  actual: string;
  message?: string;
};

type ErrorCodeObjectType = {
  errorCode: ErrorCodeType;
  errorMessage: ErrorCodeMessageType[ErrorCodeType];
  metadata?: ErrorMessageMetadata;
};

export const createErrorObject = (errorCode: number, metadata?: ErrorMessageMetadata): ErrorCodeObjectType => {
  return {
    errorCode: errorCode as ErrorCodeType,
    errorMessage: ErrorCodeMessage[errorCode as ErrorCodeType],
    metadata,
  };
};

export const createErrorString = (errorCode: number, metadata?: ErrorMessageMetadata): string => {
  return JSON.stringify(createErrorObject(errorCode, metadata));
};
