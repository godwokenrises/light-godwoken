import { useLocalStorage } from "@rehooks/local-storage";
import { useCallback, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { UniversalToken } from "light-godwoken";
import { Hash } from "@ckb-lumos/lumos";

type L1TxType = "deposit" | "withdrawal" | "transfer";

export interface BaseL1TxHistoryInterface {
  type: L1TxType;
  txHash: string;
  capacity: string;
  amount: string;
  token?: UniversalToken;
  status?: string;
  symbol?: string;
  decimals?: number;
  outPoint?: string;
  recipient?: string;
}

export interface L1TxHistoryInterface extends BaseL1TxHistoryInterface {
  date: string;
}

export function useL1TxHistory(storageKey: string | null) {
  const [txHistory, setTxHistory] = useLocalStorage<L1TxHistoryInterface[]>(storageKey || "", []);

  useEffect(() => {
    try {
      if (storageKey == null) return;
      setTxHistory(JSON.parse(localStorage.getItem(storageKey) ?? "[]"));
    } catch {
      console.warn("no storage was found for storageKey:", storageKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const addTxToHistory = useCallback(
    (newTxHistory: BaseL1TxHistoryInterface) => {
      if (storageKey == null) return;

      if (!txHistory.find((row) => row.txHash === newTxHistory.txHash)) {
        setTxHistory([
          {
            ...newTxHistory,
            date: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
          },
          ...txHistory,
        ]);
      }
    },
    [storageKey, txHistory, setTxHistory],
  );

  const updateTxHistory = useCallback(
    (newTxHistory: L1TxHistoryInterface) => {
      if (storageKey == null) return;
      setTxHistory(
        txHistory.map((tx: L1TxHistoryInterface) => {
          if (tx.txHash === newTxHistory.txHash) {
            return {
              ...tx,
              ...newTxHistory,
            };
          }
          return tx;
        }),
      );
    },
    [storageKey, txHistory, setTxHistory],
  );

  const updateTxWithStatus = useCallback(
    (txHash: Hash, status: string) => {
      if (storageKey == null) return;

      const latestTxHistory = [...txHistory];
      const index = latestTxHistory.findIndex((row) => row.txHash === txHash);
      if (index > -1) {
        latestTxHistory[index] = {
          ...latestTxHistory[index],
          status,
        };

        setTxHistory(latestTxHistory);
      }
    },
    [storageKey, txHistory, setTxHistory],
  );

  const removeTxWithTxHashes = useCallback(
    (txHashes: Hash[]) => {
      if (storageKey == null) return;
      const filtered = txHistory.filter((row) => {
        return !txHashes.includes(row.txHash);
      });

      if (filtered.length !== txHistory.length) {
        setTxHistory(filtered);
      }
    },
    [storageKey, txHistory, setTxHistory],
  );

  return useMemo(
    () => ({
      txHistory,
      setTxHistory,
      addTxToHistory,
      updateTxHistory,
      updateTxWithStatus,
      removeTxWithTxHashes,
    }),
    [addTxToHistory, removeTxWithTxHashes, setTxHistory, txHistory, updateTxHistory, updateTxWithStatus],
  );
}
