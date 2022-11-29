import { createInstance, DotbitError } from "dotbit/lib";
import { useQuery } from "react-query";
import { useMemo, useState } from "react";
import { useDebounceEffect } from "ahooks";
import { isMainnet } from "../utils/environment";

const dotbit = createInstance();

// https://github.com/satoshilabs/slips/blob/master/slip-0044.md
export enum DotBitCoinType {
  Eth = "60",
  Ckb = "309",
}

export function useDotBitReverseAlias(address?: string) {
  const query = useQuery(["dotbit-reverse-alias", address], async () => {
    if (!address) {
      return void 0;
    }

    return await dotbit.reverse({
      key: address,
      coin_type: DotBitCoinType.Eth,
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

export interface UseDotBitForwardAddressesParams {
  queryKey?: string;
  alias?: string;
}

// When forward searching for .bit addresses, only take ETH/CKB addresses
export const DotBitForwardCoinTypes: string[] = isMainnet
  ? [DotBitCoinType.Eth, DotBitCoinType.Ckb]
  : [DotBitCoinType.Eth];

export function useDotBitForwardAddresses(params: UseDotBitForwardAddressesParams) {
  const [alias, setAlias] = useState<string | undefined>(params.alias);
  const isValidAlias = useMemo(() => (alias ? /.+\.bit$/.test(alias) : false), [alias]);

  const query = useQuery(
    ["dotbit-forward-alias", params.queryKey, alias],
    async () => {
      if (!params.alias || !isValidAlias) {
        return void 0;
      }

      const addresses = await dotbit.addresses(params.alias);
      const existsAddresses: string[] = [];
      return addresses.filter((row) => {
        const isIncludedCoinType = DotBitForwardCoinTypes.includes(row.coin_type);
        const isNotInResult = !existsAddresses.includes(row.value.toLowerCase());

        if (isIncludedCoinType && isNotInResult) {
          existsAddresses.push(row.value.toLowerCase());
          return true;
        }
        return false;
      });
    },
    {
      retry: false,
      onError(e: DotbitError) {
        console.log("dotbit-error", e.code);
      },
    },
  );

  useDebounceEffect(
    () => {
      setAlias(params.alias);
    },
    [params.alias],
    {
      wait: 500,
    },
  );

  return {
    query,
    isValidAlias,
    refetch: query.refetch,
    error: query.error,
    addresses: query.data,
    isError: query.isError,
    isLoading: query.isLoading,
  };
}
