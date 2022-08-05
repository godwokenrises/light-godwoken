import { Cell, HexNumber, Hash } from "@ckb-lumos/lumos";

export interface CellWithStatus extends Cell {
  withdrawBlock: number;
}
export interface L1MappedErc20 {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  tokenURI: string;
  sudt_script_hash: Hash;
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
