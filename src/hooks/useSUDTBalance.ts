import { Script } from "@ckb-lumos/lumos";
import { useQuery, UseQueryResult } from "react-query";
import { GetSudtBalancesResult, SUDT } from "../light-godwoken/lightGodwokenType";
import { useLightGodwoken } from "./useLightGodwoken";

export const useSUDTBalance = (): UseQueryResult<GetSudtBalancesResult> => {
  const lightGodwoken = useLightGodwoken();

  return useQuery(
    ["queryBalance", { version: lightGodwoken?.getVersion(), l2Address: lightGodwoken?.provider.getL2Address() }],
    () => {
      if (!lightGodwoken) {
        throw new Error("LightGodwoken not found");
      }
      const tokenList: SUDT[] = lightGodwoken.getBuiltinSUDTList();
      const types: Script[] = tokenList.map((token) => token.type);
      return lightGodwoken.getSudtBalances({ types });
    },
    {
      enabled: !!lightGodwoken,
    },
  );
};
