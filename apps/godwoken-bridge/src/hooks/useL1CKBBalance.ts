import { useQuery, UseQueryResult } from "react-query";
import { useLightGodwoken } from "./useLightGodwoken";

export const useL1CKBBalance = (): UseQueryResult<string> => {
  const lightGodwoken = useLightGodwoken();

  return useQuery(
    ["queryL1CKBBalance", { version: lightGodwoken?.getVersion(), l2Address: lightGodwoken?.provider.getL2Address() }],
    () => {
      return lightGodwoken?.getL1CkbBalance();
    },
    {
      enabled: !!lightGodwoken,
    },
  );
};
