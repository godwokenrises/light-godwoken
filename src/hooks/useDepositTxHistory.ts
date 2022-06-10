import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { writeStorage } from "@rehooks/local-storage";
import { Token } from "../light-godwoken/lightGodwokenType";
import { useLightGodwoken } from "./useLightGodwoken";

export interface DepositHistoryType {
  txHash: string;
  date: string;
  capacity: string;
  amount: string;
  cancelTimeout: number;
  token?: Token;
  status: string;
}

export function useDepositHistory() {
  const lightGodwoken = useLightGodwoken();
  const storageKey = `${lightGodwoken?.getVersion()}/${lightGodwoken?.provider.getL1Address()}/deposit`;
  const [txHistory, setTxHistory] = useState<DepositHistoryType[]>(() => []);
  const storageValue = localStorage.getItem(storageKey);
  useLayoutEffect(() => {
    if (storageValue == null) {
      setTxHistory([]);
      return;
    }
    try {
      setTxHistory(JSON.parse(storageValue));
    } catch (err) {
      console.warn("[warn] failed to parse deposit transaction history", storageKey, err);
    }
  }, [storageValue, storageKey]);

  const addTxToHistory = useCallback(
    (newTxHistory: DepositHistoryType) => {
      if (storageKey == null) {
        return;
      }
      const latestTxHistoryRaw = storageValue || "[]";
      try {
        const latestTxHistory = JSON.parse(latestTxHistoryRaw);
        if (!latestTxHistory.find((item: DepositHistoryType) => item.txHash === newTxHistory.txHash)) {
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
      addTxToHistory,
      setTxHistory,
      updateTxWithStatus,
    }),
    [addTxToHistory, txHistory, updateTxWithStatus],
  );
}
