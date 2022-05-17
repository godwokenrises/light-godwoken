import { BI, HexString } from "@ckb-lumos/lumos";

export class LightGodwokenError<T> extends Error {
  readonly metadata: T;
  constructor(metadata: T, message: string) {
    super(message);
    this.metadata = metadata;
  }
}

export class LightGodwokenNotFoundError extends LightGodwokenError<string> {}
export class NotEnoughCapacityError extends LightGodwokenError<{ expected: BI; actual: BI }> {}
export class NotEnoughSudtError extends LightGodwokenError<{ expected: BI; actual: BI }> {}

export class Layer1RpcError extends LightGodwokenError<string> {}
export class Layer2RpcError extends LightGodwokenError<string> {}

export class EthAddressFormatError extends LightGodwokenError<{ address: string }> {}
export class Layer2AccountIdNotFoundError extends LightGodwokenError<string> {}
export class ERC20TokenNotFoundError extends LightGodwokenError<{ sudtScriptHash: HexString }> {}
export class TransactionSignError extends LightGodwokenError<string> {}
