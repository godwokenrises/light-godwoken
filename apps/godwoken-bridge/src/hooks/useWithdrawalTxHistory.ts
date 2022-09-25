import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useLightGodwoken } from "./useLightGodwoken";
import { ProxyERC20, WithdrawBase, WithdrawResultV1 } from "light-godwoken";
import { writeStorage } from "@rehooks/local-storage";
import { DepositHistoryType } from "./useDepositTxHistory";
import { Hash, HexNumber, HexString } from "@ckb-lumos/lumos";

export interface LocalWithdrawalHistory {
  capacity: HexNumber;
  amount: HexNumber;
  erc20?: ProxyERC20;
  l2TxHash?: Hash;
  withdrawalHash?: HexString;
  withdrawalBlockNumber?: number;
  status: "pending" | "success" | "failed";
}

export function useWithdrawalTxHistory<T extends LocalWithdrawalHistory = LocalWithdrawalHistory>() {
  const lightGodwoken = useLightGodwoken();
  const storageKey = `${lightGodwoken?.getVersion()}/${lightGodwoken?.provider.getL1Address()}/withdrawal`;

  const [txHistory, setTxHistory] = useState<T[]>(() => []);
  const storageValue = localStorage.getItem(storageKey);

  useLayoutEffect(() => {
    if (storageValue == null) {
      setTxHistory([]);
      return;
    }
    try {
      setTxHistory(JSON.parse(storageValue));
    } catch (err) {
      console.warn("[warn] failed to parse withdrawal transaction history", storageKey, err);
    }
  }, [storageValue, storageKey]);

  const addTxToHistory = useCallback(
    (newTxHistory: T) => {
      if (storageKey == null) {
        return;
      }
      const latestTxHistoryRaw = storageValue || "[]";
      try {
        const latestTxHistory = JSON.parse(latestTxHistoryRaw);
        if (!latestTxHistory.find((item: T) => item.withdrawalHash === newTxHistory.withdrawalHash)) {
          const newTxHistoryList = [newTxHistory].concat(latestTxHistory);
          setTxHistory(newTxHistoryList);
          writeStorage(storageKey, JSON.stringify(newTxHistoryList));
        }
      } catch (err) {
        console.warn("[warn] failed to parse deposit transaction history", storageKey, err);
      }
    },
    [storageValue, storageKey],
  );

  const updateTxWithStatus = useCallback(
    (txHash: string, status: string) => {
      if (storageKey == null) {
        return;
      }
      const latestTxHistoryRaw = storageValue || "[]";
      try {
        const latestTxHistory = JSON.parse(latestTxHistoryRaw);
        const newHistory = latestTxHistory.map((tx: DepositHistoryType) => {
          if (tx.txHash === txHash) {
            tx = { ...tx, status };
            return tx;
          }
          return tx;
        });
        writeStorage(storageKey, JSON.stringify(newHistory));
        setTxHistory(newHistory);
      } catch (err) {
        console.warn("[warn] failed to parse deposit transaction history", storageKey, err);
      }
    },
    [storageKey, storageValue],
  );

  return useMemo(
    () => ({
      txHistory,
      setTxHistory,
      addTxToHistory,
      updateTxWithStatus,
    }),
    [addTxToHistory, txHistory, updateTxWithStatus],
  );
}
