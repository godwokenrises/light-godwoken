import { useQuery, UseQueryResult } from "react-query";
import { useLightGodwoken } from "./useLightGodwoken";
import { useUpdateEffect } from "ahooks";
import { useState } from "react";

export const useL2CKBBalance = (): UseQueryResult<string> => {
  const [id, setId] = useState(Math.random());
  const lightGodwoken = useLightGodwoken();

  const query = useQuery(
    [
      "queryL2CKBBalance",
      {
        id,
        version: lightGodwoken?.getVersion(),
        l2Address: lightGodwoken?.provider.getL2Address(),
      },
    ],
    () => {
      return lightGodwoken!.getL2CkbBalance();
    },
    {
      enabled: !!lightGodwoken,
    },
  );

  useUpdateEffect(() => {
    setId(Math.random());
  }, [lightGodwoken]);

  return query as UseQueryResult<string>;
};
