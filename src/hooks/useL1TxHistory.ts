import { useCallback, useLayoutEffect, useMemo, useState } from "react";

type L1TxType = "deposit" | "withdrawal";

export interface L1TxHistoryInterface {
  type: L1TxType;
  txHash: string;
  capacity: string;
  amount: string;
  symbol?: string;
  decimals?: number;
  outPoint?: string;
  recipient?: string;
}

export function useL1TxHistory(storageKey?: string) {
  const [txHistory, setTxHistory] = useState<L1TxHistoryInterface[]>(() => []);

  useLayoutEffect(() => {
    if (storageKey == null) {
      return;
    }

    const rawData = localStorage.getItem(storageKey);
    if (rawData == null) {
      setTxHistory([]);
      return;
    }

    try {
      setTxHistory(JSON.parse(rawData));
    } catch (err) {
      console.warn("[warn] failed to parse layer 1 transaction history", storageKey, err);
    }
  }, [storageKey]);

  const addTxToHistory = useCallback(
    (newTxHistory: L1TxHistoryInterface) => {
      if (storageKey == null) {
        return;
      }

      const latestTxHistoryRaw = localStorage.getItem(storageKey) || "[]";
      try {
        const latestTxHistory = JSON.parse(latestTxHistoryRaw);
        localStorage.setItem(storageKey, JSON.stringify([newTxHistory].concat(latestTxHistory)));
      } catch (err) {
        console.warn("[warn] failed to parse layer 1 transaction history", storageKey, err);
      }
    },
    [storageKey],
  );

  return useMemo(
    () => ({
      txHistory,
      addTxToHistory,
      setTxHistory,
    }),
    [addTxToHistory, txHistory],
  );
}
