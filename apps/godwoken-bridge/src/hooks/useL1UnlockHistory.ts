import { Hash } from "@ckb-lumos/lumos";
import { useCallback, useEffect, useMemo } from "react";
import { useLocalStorage } from "@rehooks/local-storage";

export interface ManualUnlockHistory {
  withdrawalTxHash: Hash;
  unlockTxHash: Hash;
}

export function useL1UnlockHistory(storageKey: string) {
  const [unlockHistory, setUnlockHistory] = useLocalStorage<ManualUnlockHistory[]>(storageKey, []);

  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem(storageKey) || "[]");
      setUnlockHistory(list);
    } catch {
      console.warn("no storage was found for storageKey:", storageKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const updateUnlockHistoryItem = useCallback(
    (history: ManualUnlockHistory) => {
      const mapped = unlockHistory.map((row) => (row.withdrawalTxHash === history.withdrawalTxHash ? history : row));
      setUnlockHistory(mapped);
    },
    [unlockHistory, setUnlockHistory],
  );

  const addUnlockHistoryItem = useCallback(
    (history: ManualUnlockHistory) => {
      const exists = unlockHistory.find((row) => row.withdrawalTxHash === history.withdrawalTxHash);
      if (!exists) {
        const copiedList = [...unlockHistory];
        copiedList.push(history);
        setUnlockHistory(copiedList);
      }
    },
    [unlockHistory, setUnlockHistory],
  );

  const removeUnlockHistoryItem = useCallback(
    (withdrawalTxHash: Hash) => {
      const filtered = unlockHistory.filter((row) => row.withdrawalTxHash !== withdrawalTxHash);
      setUnlockHistory(filtered);
    },
    [unlockHistory, setUnlockHistory],
  );

  return useMemo(
    () => ({
      unlockHistory,
      setUnlockHistory,
      addUnlockHistoryItem,
      updateUnlockHistoryItem,
      removeUnlockHistoryItem,
    }),
    [unlockHistory, setUnlockHistory, addUnlockHistoryItem, updateUnlockHistoryItem, removeUnlockHistoryItem],
  );
}
