import { useQuery, UseQueryResult } from "react-query";
import { LightGodwokenV1 } from "light-godwoken";
import { useLightGodwoken } from "./useLightGodwoken";

export const useChainId = (): UseQueryResult<string> => {
  const lightGodwoken = useLightGodwoken();

  return useQuery(
    ["queryChainId"],
    () => {
      if (!lightGodwoken) {
        throw new Error("LightGodwokenV1 not found");
      }
      if (lightGodwoken instanceof LightGodwokenV1) {
        return lightGodwoken.getChainId();
      }
      return "";
    },
    {
      enabled: !!lightGodwoken,
    },
  );
};
