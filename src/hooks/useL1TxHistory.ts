import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { writeStorage } from "@rehooks/local-storage";
import { TokenExtra } from "../light-godwoken/lightGodwokenType";
import { format } from "date-fns";

type L1TxType = "deposit" | "withdrawal";

export interface BaseL1TxHistoryInterface {
  type: L1TxType;
  txHash: string;
  capacity: string;
  amount: string;
  token?: TokenExtra;
  status?: string;
  symbol?: string;
  decimals?: number;
  outPoint?: string;
  recipient?: string;
}

export interface L1TxHistoryInterface extends BaseL1TxHistoryInterface {
  date: string;
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
    (newTxHistory: BaseL1TxHistoryInterface) => {
      if (storageKey == null) {
        return;
      }
      const newRecord = { ...newTxHistory, date: format(new Date(), "yyyy-MM-dd HH:mm:ss") };
      const latestTxHistoryRaw = storageValue || "[]";
      try {
        const latestTxHistory = JSON.parse(latestTxHistoryRaw);
        if (!latestTxHistory.find((item: L1TxHistoryInterface) => item.txHash === newRecord.txHash)) {
          const newTxHistoryList = [newRecord].concat(latestTxHistory);
          setTxHistory(newTxHistoryList);
          writeStorage(storageKey, JSON.stringify(newTxHistoryList));
        }
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
        const newHistory = latestTxHistory.map((tx: L1TxHistoryInterface) => {
          if (tx.txHash === txHistory.txHash) {
            tx = { ...tx, ...txHistory };
            return tx;
          }
          return tx;
        });
        writeStorage(storageKey, JSON.stringify(newHistory));
        setTxHistory(newHistory);
      } catch (err) {
        console.warn("[warn] failed to parse layer 1 transaction history", storageKey, err);
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
        const newHistory = latestTxHistory.map((tx: L1TxHistoryInterface) => {
          if (tx.txHash === txHash) {
            tx = { ...tx, status };
            return tx;
          }
          return tx;
        });
        writeStorage(storageKey, JSON.stringify(newHistory));
        setTxHistory(newHistory);
      } catch (err) {
        console.warn("[warn] failed to parse layer 1 transaction history", storageKey, err);
      }
    },
    [storageKey, storageValue],
  );

  return useMemo(
    () => ({
      txHistory,
      addTxToHistory,
      setTxHistory,
      updateTxHistory,
      updateTxWithStatus,
    }),
    [addTxToHistory, txHistory, updateTxHistory, updateTxWithStatus],
  );
}
