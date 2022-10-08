import { Hash } from "@ckb-lumos/lumos";
import { useCallback, useMemo } from "react";
import { useLocalStorage } from "@rehooks/local-storage";

export interface ManualUnlockHistory {
  withdrawalTxHash: Hash;
  unlockTxHash: Hash;
}

export function useL1UnlockHistory(storageKey: string) {
  const [unlockHistory, setUnlockHistory] = useLocalStorage<ManualUnlockHistory[]>(storageKey, []);

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
