import { Address, Cell, Hash, HexNumber, Transaction, helpers, Script } from "@ckb-lumos/lumos";
import { WithdrawalRequest } from "./godwoken/normalizer";

export interface GetL2CkbBalancePayload {
  l2Address?: string;
}

export interface L1MappedErc20 {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  tokenURI: string;

  sudt_script_hash: Hash;
}

export interface L1Token {
  type: Script;
}

export interface GetErc20BalancesResult {
  balances: HexNumber[];
}

export interface GetErc20Balances {
  addresses: string[];
}

interface WithdrawListener {
  (event: "sending", listener: () => void): void;
  (event: "sent", listener: (txHash: Hash) => void): void;
  (event: "pending", listener: (txHash: Hash) => void): void;
  (event: "success", listener: (txHash: Hash) => void): void;
  (event: "error", listener: (e: Error) => void): void;
}

export interface WithdrawalEventEmitter {
  on: WithdrawListener;
}

export interface WithdrawalEventEmitterPayload {
  // CKB capacity
  capacity: HexNumber;
  // L1 mapped sUDT amount
  amount: HexNumber;
  /**
   * {@link L1MappedErc20}
   */
  sudt_script_hash: Hash;

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

  erc20?: L1MappedErc20;
}

export interface UnlockPayload {
  cell: Cell;
}

export interface DepositPayload {
  capacity: HexNumber;
  amount?: HexNumber;
  sudtType?: Script;
}

type Promisable<T> = Promise<T> | T;

export interface LightGodwokenProvider {
  getL2Address(): Promisable<string>;

  getL1Address(): Promisable<string>;

  // TODO the unknown is godwoken submit_withdrawal_tx
  sendWithdrawTransaction: (withdrawalRequest: WithdrawalRequest) => Promise<Hash>;

  signL1Transaction: (tx: helpers.TransactionSkeletonType) => Promise<Transaction>;

  // now only supported omni lock, the other lock type will be supported later
  sendL1Transaction: (tx: Transaction) => Promise<Hash>;
}

export interface LightGodwoken {
  provider: LightGodwokenProvider;

  /**
   * get producing 1 block time
   */
  getBlockProduceTime: () => Promise<number> | number;

  unlock: (payload: UnlockPayload) => Promise<Hash>;

  listWithdraw: () => Promise<WithdrawResult[]>;

  deposit?: (payload: DepositPayload) => Promise<Hash>;

  withdrawWithEvent: (payload: WithdrawalEventEmitterPayload) => WithdrawalEventEmitter;

  getL2CkbBalance: (payload?: GetL2CkbBalancePayload) => Promise<HexNumber>;

  getBuiltinErc20List: () => L1MappedErc20[];

  getBuiltinL1TokenList: () => L1Token[];

  getErc20Balances: (payload: GetErc20Balances) => Promise<GetErc20BalancesResult>;
}
