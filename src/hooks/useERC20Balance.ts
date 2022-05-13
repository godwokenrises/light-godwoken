import { useQuery, UseQueryResult } from "react-query";
import { GetErc20BalancesResult } from "../light-godwoken/lightGodwokenType";
import { L1MappedErc20 } from "../types/type";
import { useLightGodwoken } from "./useLightGodwoken";

export const useERC20Balance = (): UseQueryResult<GetErc20BalancesResult> => {
  const lightGodwoken = useLightGodwoken();

  return useQuery(
    ["queryBalance", { version: lightGodwoken?.getVersion(), l2Address: lightGodwoken?.provider.getL2Address() }],
    () => {
      if (!lightGodwoken) {
        throw new Error("LightGodwoken not found");
      }
      const results: L1MappedErc20[] = lightGodwoken.getBuiltinErc20List();
      const addressList = results.map((erc20) => erc20.address);
      return lightGodwoken.getErc20Balances({ addresses: addressList });
    },
    {
      enabled: !!lightGodwoken,
    },
  );
};
