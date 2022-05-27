import { Address, Cell, Hash, HexNumber, Transaction, helpers, Script, BI, HexString } from "@ckb-lumos/lumos";
import EventEmitter from "events";
import { LightGodwokenConfig } from "./constants/configTypes";

export interface GetL2CkbBalancePayload {
  l2Address?: string;
}

export interface GetL1CkbBalancePayload {
  l1Address?: string;
}
export interface Token {
  name: string;
  symbol: string;
  decimals: number;
  tokenURI: string;
}

interface ERC20 extends Token {
  address: string;
}
export interface ProxyERC20 extends ERC20 {
  sudt_script_hash: Hash;
}
export interface SUDT extends Token {
  type: Script;
}

export interface GetErc20BalancesResult {
  balances: HexNumber[];
}

export interface GetSudtBalancesResult {
  balances: HexNumber[];
}

export interface GetErc20Balances {
  addresses: string[];
}

export interface GetSudtBalances {
  types: Script[];
}

export interface GodwokenNetworkConfig {
  testnetV1: "https://godwoken-testnet-web3-v1-rpc.ckbapp.dev";
}

interface WithdrawListener {
  (event: "sent", listener: (txHash: Hash) => void): void;
  (event: "pending", listener: (txHash: Hash) => void): void;
  (event: "success", listener: (txHash: Hash) => void): void;
  (event: "fail", listener: (e: Error) => void): void;
}

interface DepositListener {
  (event: "sent", listener: (txHash: Hash) => void): void;
  (event: "pending", listener: (txHash: Hash) => void): void;
  (event: "success", listener: (txHash: Hash) => void): void;
  (event: "fail", listener: (e: Error) => void): void;
}

export interface WithdrawalEventEmitter {
  on: WithdrawListener;
}

export interface DepositEventEmitter {
  on: DepositListener;
}

export interface BaseWithdrawalEventEmitterPayload {
  // CKB capacity
  capacity: HexNumber;
  // L1 mapped sUDT amount
  amount: HexNumber;
  /**
   * {@link L1MappedErc20}
   */
  sudt_script_hash: Hash;
}
export interface WithdrawalEventEmitterPayload extends BaseWithdrawalEventEmitterPayload {
  /**
   * withdraw to L1 address
   */
  withdrawal_address?: Address;
}

export interface WithdrawResult {
  cell: Cell;

  withdrawalBlockNumber: number;

  // relative to withdrawalBlockNumber
  remainingBlockNumber: number;

  capacity: HexNumber;
  amount: HexNumber;
  sudt_script_hash: Hash;

  erc20?: ProxyERC20;
}

export interface UnlockPayload {
  cell: Cell;
}

export interface DepositPayload {
  capacity: HexNumber;
  amount?: HexNumber;
  sudtType?: Script;
}

export interface PendingDepositTransaction {
  tx_hash: Hash;
}

type Promisable<T> = Promise<T> | T;

export const CKB_SUDT_ID = 1;

export interface LightGodwokenProvider {
  claimUSDC(): Promise<HexString>;

  getL2Address(): Promisable<string>;

  getConfig(): LightGodwokenConfig;

  getL1Address(): Promisable<string>;

  getMinFeeRate(): Promise<BI>;

  signL1TxSkeleton: (tx: helpers.TransactionSkeletonType) => Promise<Transaction>;

  signL1Tx: (tx: Transaction) => Promise<Transaction>;

  // now only supported omni lock, the other lock type will be supported later
  sendL1Transaction: (tx: Transaction) => Promise<Hash>;
}

export type GodwokenVersion = "v0" | "v1";

export type DepositRequest = {
  blockNumber: BI;
  capacity: BI;
  amount: BI;
  sudt?: SUDT;
  cancelTime: BI;
  rawCell: Cell;
};

export interface LightGodwokenBase {
  provider: LightGodwokenProvider;

  cancelDeposit(cell: Cell): Promise<HexString>;

  getCkbBlockProduceTime(): Promisable<number>;

  getDepositList(): Promise<DepositRequest[]>;

  getCkbCurrentBlockNumber(): Promise<BI>;

  getConfig(): LightGodwokenConfig;

  claimUSDC(): Promise<HexString>;

  getVersion: () => GodwokenVersion;

  getNativeAsset: () => Token;

  getChainId: () => Promise<HexNumber> | HexNumber;

  /**
   * get producing 1 block time
   */
  getBlockProduceTime: () => Promise<number> | number;

  getWithdrawalWaitBlock: () => Promise<number> | number;

  listWithdraw: () => Promise<WithdrawResult[]>;

  generateDepositLock: () => Script;

  deposit: (payload: DepositPayload, eventEmitter: EventEmitter) => Promise<Hash>;

  depositWithEvent: (payload: DepositPayload) => DepositEventEmitter;

  subscribPendingDepositTransactions: (payload: PendingDepositTransaction[]) => DepositEventEmitter;

  withdrawWithEvent: (payload: WithdrawalEventEmitterPayload) => WithdrawalEventEmitter;

  getL2CkbBalance: (payload?: GetL2CkbBalancePayload) => Promise<HexNumber>;

  getL1CkbBalance: (payload?: GetL1CkbBalancePayload) => Promise<HexNumber>;

  getBuiltinErc20List: () => ProxyERC20[];

  getBuiltinSUDTList: () => SUDT[];

  getErc20Balances: (payload: GetErc20Balances) => Promise<GetErc20BalancesResult>;

  getSudtBalances: (payload: GetSudtBalances) => Promise<GetSudtBalancesResult>;
}

export interface LightGodwokenV0 extends LightGodwokenBase {
  unlock: (payload: UnlockPayload) => Promise<Hash>;
  withdrawToV1WithEvent: (payload: BaseWithdrawalEventEmitterPayload) => WithdrawalEventEmitter;
}
export interface LightGodwokenV1 extends LightGodwokenBase {}
