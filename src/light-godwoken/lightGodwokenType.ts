import { Address, Cell, Hash, HexNumber, Transaction, helpers, Script, BI } from "@ckb-lumos/lumos";

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
  (event: "sending", listener: () => void): void;
  (event: "sent", listener: (txHash: Hash) => void): void;
  (event: "pending", listener: (txHash: Hash) => void): void;
  (event: "success", listener: (txHash: Hash) => void): void;
  (event: "error", listener: (e: Error) => void): void;
  (event: "fail", listener: (e: Error) => void): void;
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

  erc20?: ProxyERC20;
}

export interface UnlockPayload {
  cell: Cell;
}

export interface DepositPayload {
  capacity: HexNumber;
  amount?: HexNumber;
  sudtType?: Script;
  depositMax?: boolean;
}

type Promisable<T> = Promise<T> | T;

export const CKB_SUDT_ID = 1;

export interface LightGodwokenProvider {
  getL2Address(): Promisable<string>;

  getL1Address(): Promisable<string>;

  getMinFeeRate(): Promise<BI>;

  signL1Transaction: (tx: helpers.TransactionSkeletonType) => Promise<Transaction>;

  // now only supported omni lock, the other lock type will be supported later
  sendL1Transaction: (tx: Transaction) => Promise<Hash>;
}

export type GodwokenVersion = "v0" | "v1";

export interface LightGodwokenBase {
  provider: LightGodwokenProvider;

  getVersion: () => GodwokenVersion;

  /**
   * get producing 1 block time
   */
  getBlockProduceTime: () => Promise<number> | number;

  listWithdraw: () => Promise<WithdrawResult[]>;

  deposit: (payload: DepositPayload) => Promise<Hash>;

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
}
export interface LightGodwokenV1 extends LightGodwokenBase {
  getChainId: () => Promise<HexNumber>;
}
