import { Hash, HexNumber, HexString, PackedSince, Script } from "@ckb-lumos/base";
import { normalizers, Reader } from "ckb-js-toolkit";
import { L2Transaction, WithdrawalRequest, WithdrawalRequestExtra, WithdrawalRequestV1 } from "./types";

// Taken for now from https://github.com/xxuejie/ckb-js-toolkit/blob/68f5ff709f78eb188ee116b2887a362123b016cc/src/normalizers.js#L17-L69,
// later we can think about exposing those functions directly.
function normalizeHexNumber(length: number) {
  return function (debugPath: string, value: any) {
    if (!(value instanceof ArrayBuffer)) {
      let intValue = BigInt(value).toString(16);
      if (intValue.length % 2 !== 0) {
        intValue = "0" + intValue;
      }
      if (intValue.length / 2 > length) {
        throw new Error(`${debugPath} is ${intValue.length / 2} bytes long, expected length is ${length}!`);
      }
      const view = new DataView(new ArrayBuffer(length));
      for (let i = 0; i < intValue.length / 2; i++) {
        const start = intValue.length - (i + 1) * 2;
        view.setUint8(i, parseInt(intValue.substr(start, 2), 16));
      }
      value = view.buffer;
    }
    if (value.byteLength < length) {
      const array = new Uint8Array(length);
      array.set(new Uint8Array(value), 0);
      value = array.buffer;
    }
    return value;
  };
}

function normalizeRawData(length: number) {
  return function (debugPath: string, value: any) {
    value = new Reader(value).toArrayBuffer();
    if (length > 0 && value.byteLength !== length) {
      throw new Error(`${debugPath} has invalid length ${value.byteLength}, required: ${length}`);
    }
    return value;
  };
}

function normalizeObject(debugPath: string, obj: any, keys: object) {
  const result: any = {};

  for (const [key, f] of Object.entries(keys)) {
    const value = obj[key];
    if (value === undefined || value === null) {
      throw new Error(`${debugPath} is missing ${key}!`);
    }
    result[key] = f(`${debugPath}.${key}`, value);
  }
  return result;
}

function toNormalize(normalize: Function) {
  return function (debugPath: string, value: any) {
    return normalize(value, {
      debugPath,
    });
  };
}

export interface DepositRequest {
  capacity: HexNumber;
  amount: HexNumber;
  sudt_script_hash: Hash;
  script: Script;
}

export function NormalizeDepositRequest(request: object, { debugPath = "deposit_request" } = {}) {
  return normalizeObject(debugPath, request, {
    capacity: normalizeHexNumber(8),
    amount: normalizeHexNumber(16),
    sudt_script_hash: normalizeRawData(32),
    script: toNormalize(normalizers.NormalizeScript),
  });
}

export interface DepositLockArgs {
  owner_lock_hash: Hash;
  layer2_lock: Script;
  cancel_timeout: PackedSince;
}

export function NormalizeDepositLockArgs(args: object, { debugPath = "deposit_lock_args" } = {}) {
  return normalizeObject(debugPath, args, {
    owner_lock_hash: normalizeRawData(32),
    layer2_lock: toNormalize(normalizers.NormalizeScript),
    cancel_timeout: normalizeHexNumber(8),
  });
}

export interface HeaderInfo {
  number: HexNumber;
  block_hash: Hash;
}

export function NormalizeHeaderInfo(headerInfo: object, { debugPath = "header_info" } = {}) {
  return normalizeObject(debugPath, headerInfo, {
    number: normalizeHexNumber(8),
    block_hash: normalizeRawData(32),
  });
}

export interface CustodianLockArgs {
  deposit_block_hash: Hash;
  deposit_block_number: HexNumber;
  deposit_lock_args: DepositLockArgs;
}

export function NormalizeCustodianLockArgs(args: object, { debugPath = "custondian_lock_args" } = {}) {
  return normalizeObject(debugPath, args, {
    deposit_block_hash: normalizeRawData(32),
    deposit_block_number: normalizeHexNumber(8),
    deposit_lock_args: toNormalize(NormalizeDepositLockArgs),
  });
}

export function NormalizeRawL2Transaction(rawL2Transaction: object, { debugPath = "raw_l2_transaction" } = {}) {
  return normalizeObject(debugPath, rawL2Transaction, {
    from_id: normalizeHexNumber(4),
    to_id: normalizeHexNumber(4),
    nonce: normalizeHexNumber(4),
    args: normalizeRawData(-1),
  });
}

export function NormalizeL2Transaction(l2Transaction: L2Transaction, { debugPath = "l2_transaction" } = {}) {
  return normalizeObject(debugPath, l2Transaction, {
    raw: toNormalize(NormalizeRawL2Transaction),
    signature: normalizeRawData(-1),
  });
}

export function NormalizeRawWithdrawalRequest(raw_request: object, { debugPath = "raw_withdrawal_request" } = {}) {
  return normalizeObject(debugPath, raw_request, {
    nonce: normalizeHexNumber(4),
    capacity: normalizeHexNumber(8),
    amount: normalizeHexNumber(16),
    sudt_script_hash: normalizeRawData(32),
    account_script_hash: normalizeRawData(32),
    sell_amount: normalizeHexNumber(16),
    sell_capacity: normalizeHexNumber(8),
    owner_lock_hash: normalizeRawData(32),
    payment_lock_hash: normalizeRawData(32),
    fee: toNormalize(NormalizeFee),
  });
}

export function NormalizeRawWithdrawalRequestV1(raw_request_v1: object, { debugPath = "raw_withdrawal_request" } = {}) {
  return normalizeObject(debugPath, raw_request_v1, {
    nonce: normalizeHexNumber(4),
    chain_id: normalizeHexNumber(8),
    // CKB amount
    capacity: normalizeHexNumber(8),
    // SUDT amount
    amount: normalizeHexNumber(16),
    sudt_script_hash: normalizeRawData(32),
    // layer2 account_script_hash
    account_script_hash: normalizeRawData(32),
    // layer1 lock to withdraw after challenge period
    owner_lock_hash: normalizeRawData(32),
    // withdrawal fee, paid to block producer
    fee: normalizeHexNumber(8),
  });
}

export function NormalizeWithdrawalRequestV1(
  request_v1: WithdrawalRequestV1,
  { debugPath = "withdrawal_request" } = {},
) {
  return normalizeObject(debugPath, request_v1, {
    raw: toNormalize(NormalizeRawWithdrawalRequestV1),
    signature: normalizeRawData(65),
  });
}

export function NormalizeWithdrawalReqExtra(
  withdrawalReqExtra: WithdrawalRequestExtra,
  { debugPath = "withdrawal_request" } = {},
) {
  return normalizeObject(debugPath, withdrawalReqExtra, {
    request: toNormalize(NormalizeWithdrawalRequestV1),
    owner_lock: toNormalize(normalizers.NormalizeScript),
  });
}

export function NormalizeWithdrawalRequest(request: WithdrawalRequest, { debugPath = "withdrawal_request" } = {}) {
  return normalizeObject(debugPath, request, {
    raw: toNormalize(NormalizeRawWithdrawalRequest),
    signature: normalizeRawData(65),
  });
}

export interface UnoinType {
  type: string;
  value: any;
}

export function NormalizeFee(fee: object, { debugPath = "fee" } = {}) {
  return normalizeObject(debugPath, fee, {
    sudt_id: normalizeHexNumber(4),
    amount: normalizeHexNumber(16),
  });
}

export function NormalizeCreateAccount(createAccount: object, { debugPath = "create_account" } = {}) {
  return normalizeObject(debugPath, createAccount, {
    script: toNormalize(normalizers.NormalizeScript),
    fee: toNormalize(NormalizeFee),
  });
}

export interface SUDTQuery {
  short_address: HexString;
}

export function NormalizeSUDTQuery(sudt_query: object, { debugPath = "sudt_query" } = {}) {
  return normalizeObject(debugPath, sudt_query, {
    short_address: normalizeRawData(20),
  });
}

export interface SUDTTransfer {
  to: HexString;
  amount: HexNumber;
  fee: HexNumber;
}

export function NormalizeSUDTTransfer(sudt_transfer: object, { debugPath = "sudt_transfer" } = {}) {
  return normalizeObject(debugPath, sudt_transfer, {
    to: normalizeRawData(20),
    amount: normalizeHexNumber(16),
    fee: normalizeHexNumber(16),
  });
}

export function NormalizeWithdrawalLockArgs(withdrawal_lock_args: object, { debugPath = "withdrawal_lock_args" } = {}) {
  return normalizeObject(debugPath, withdrawal_lock_args, {
    // the original deposit info
    // used for helping programs generate reverted custodian cell
    // deposit_block_hash: normalizeRawData(32),
    // deposit_block_number: normalizeHexNumber(8),
    account_script_hash: normalizeRawData(32),
    // the original custodian lock hash
    withdrawal_block_hash: normalizeRawData(32),
    withdrawal_block_number: normalizeHexNumber(8),
    // buyer can pay sell_amount token to unlock
    sudt_script_hash: normalizeRawData(32),
    sell_amount: normalizeHexNumber(16),
    sell_capacity: normalizeHexNumber(8),
    // layer1 lock to withdraw after challenge period
    owner_lock_hash: normalizeRawData(32),
    // layer1 lock to receive the payment, must exists on the chain
    payment_lock_hash: normalizeRawData(32),
  });
}

export function NormalizeUnlockWithdrawalViaFinalize(
  unlock_withdrawal_finalize: object,
  { debugPath = "unlock_withdrawal_finalize" } = {},
) {
  return normalizeObject(debugPath, unlock_withdrawal_finalize, {});
}
