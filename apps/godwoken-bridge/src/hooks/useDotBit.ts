import { createInstance } from "dotbit/lib";
import { useQuery } from "react-query";
import { useMemo } from "react";

const dotbit = createInstance();

// https://github.com/satoshilabs/slips/blob/master/slip-0044.md
export enum DotBitChain {
  Ether = "60",
}

export function useDotBitAlias(address?: string) {
  const query = useQuery(["dotbit-alias", address], async () => {
    if (!address) {
      return void 0;
    }

    return await dotbit.reverse({
      key: address,
      coin_type: DotBitChain.Ether,
    });
  });

  return useMemo(
    () => ({
      query,
      data: query.data,
      isLoading: query.isLoading,
    }),
    [query],
  );
}
