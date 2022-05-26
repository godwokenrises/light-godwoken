import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useLocalStorage, writeStorage } from "@rehooks/local-storage";
import { SUDT } from "../light-godwoken/lightGodwokenType";

type L1TxType = "deposit" | "withdrawal";

export interface L1TxHistoryInterface {
  type: L1TxType;
  txHash: string;
  capacity: string;
  amount: string;
  sudt?: SUDT;
  status?: string;
  symbol?: string;
  decimals?: number;
  outPoint?: string;
  recipient?: string;
  date?: string;
}

export function useL1TxHistory(storageKey: string) {
  const [txHistory, setTxHistory] = useState<L1TxHistoryInterface[]>(() => []);
  const storageValue = localStorage.getItem(storageKey);
  useLayoutEffect(() => {
    if (storageValue == null) {
      setTxHistory([]);
      return;
    }

    try {
      setTxHistory(JSON.parse(storageValue));
    } catch (err) {
      console.warn("[warn] failed to parse layer 1 transaction history", storageKey, err);
    }
  }, [storageValue, storageKey]);

  const addTxToHistory = useCallback(
    (newTxHistory: L1TxHistoryInterface) => {
      if (storageKey == null) {
        return;
      }
      newTxHistory.date = new Date().toLocaleString();
      const latestTxHistoryRaw = storageValue || "[]";
      try {
        const latestTxHistory = JSON.parse(latestTxHistoryRaw);
        writeStorage(storageKey, JSON.stringify([newTxHistory].concat(latestTxHistory)));
      } catch (err) {
        console.warn("[warn] failed to parse layer 1 transaction history", storageKey, err);
      }
    },
    [storageValue, storageKey],
  );

  const updateTxHistory = useCallback(
    (txHistory: L1TxHistoryInterface) => {
      if (storageKey == null) {
        return;
      }
      const latestTxHistoryRaw = storageValue || "[]";
      try {
        const latestTxHistory = JSON.parse(latestTxHistoryRaw);
        latestTxHistory.forEach((tx: L1TxHistoryInterface) => {
          if (tx.txHash === txHistory.txHash) {
            tx = { ...tx, ...txHistory };
          }
        });
        writeStorage(storageKey, JSON.stringify(latestTxHistory));
      } catch (err) {
        console.warn("[warn] failed to parse layer 1 transaction history", storageKey, err);
      }
    },
    [storageValue, storageKey],
  );

  return useMemo(
    () => ({
      txHistory,
      addTxToHistory,
      setTxHistory,
      updateTxHistory,
    }),
    [addTxToHistory, txHistory, updateTxHistory],
  );
}
