import { useQuery, UseQueryResult } from "react-query";
import { useLightGodwoken } from "./useLightGodwoken";

export const useL2CKBBalance = (): UseQueryResult<string> => {
  const lightGodwoken = useLightGodwoken();

  return useQuery(
    ["queryL2CKBBalance", { version: lightGodwoken?.getVersion(), l2Address: lightGodwoken?.provider.getL2Address() }],
    () => {
      return lightGodwoken?.getL2CkbBalance();
    },
    {
      enabled: !!lightGodwoken,
    },
  );
};
