import { useQuery, UseQueryResult } from "react-query";
import { useLightGodwoken } from "./useLightGodwoken";

export const useCKBBalance = (isL1: boolean): UseQueryResult<string> => {
  const lightGodwoken = useLightGodwoken();

  return useQuery(
    ["queryBalance", { isL1 }],
    () => {
      return isL1 ? lightGodwoken?.getL1CkbBalance() : lightGodwoken?.getL2CkbBalance();
    },
    {
      enabled: !!lightGodwoken,
    },
  );
};
