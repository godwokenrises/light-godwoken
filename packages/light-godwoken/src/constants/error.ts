import { BI, HexString } from "@ckb-lumos/lumos";

export class LightGodwokenError<T> extends Error {
  readonly metadata: T;
  constructor(metadata: T, message: string) {
    super(message);
    this.metadata = metadata;
  }
}

export class EthereumNotFoundError extends LightGodwokenError<string> {}
export class LightGodwokenConfigNotFoundError extends LightGodwokenError<string> {}
export class LightGodwokenConfigNotValidError extends LightGodwokenError<string> {}
export class LightGodwokenNotFoundError extends LightGodwokenError<string> {}
export class NotEnoughCapacityError extends LightGodwokenError<{ expected: BI; actual: BI }> {}
export class NotEnoughSudtError extends LightGodwokenError<{ expected: BI; actual: BI }> {}

export class Layer1RpcError extends LightGodwokenError<string> {}
export class Layer2RpcError extends LightGodwokenError<string> {}

export class V1WithdrawTokenNotEnoughError extends LightGodwokenError<string> {}
export class V0WithdrawTokenNotEnoughError extends LightGodwokenError<string> {}

export class EthAddressFormatError extends LightGodwokenError<{ address: string }> {}
export class Layer2AccountIdNotFoundError extends LightGodwokenError<string> {}
export class ERC20TokenNotFoundError extends LightGodwokenError<{ sudtScriptHash: HexString }> {}
export class TransactionSignError extends LightGodwokenError<string> {}
export class EnvNotFoundError extends LightGodwokenError<string> {}
export class SudtNotFoundError extends LightGodwokenError<string> {}
export class Erc20NotFoundError extends LightGodwokenError<string> {}

export class DepositTxNotFoundError extends LightGodwokenError<string> {}
export class DepositCellNotFoundError extends LightGodwokenError<string> {}
export class DepositTimeoutError extends LightGodwokenError<string> {}
export class DepositRejectedError extends LightGodwokenError<string> {}
export class DepositCanceledError extends LightGodwokenError<string> {}
export class WithdrawalTimeoutError extends LightGodwokenError<string> {}

export class L1TransactionTimeoutError extends LightGodwokenError<string> {}
export class L1TransactionRejectedError extends LightGodwokenError<string> {}
export class L1TransactionNotExistError extends LightGodwokenError<string> {}

export class TokenListNotFoundError extends LightGodwokenError<string> {}
