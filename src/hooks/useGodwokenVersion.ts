import { GodwokenVersion } from "../light-godwoken/constants/configTypes";
import { useLightGodwoken } from "./useLightGodwoken";

export const useGodwokenVersion = (): GodwokenVersion | undefined => {
  const lightGodwoken = useLightGodwoken();
  return lightGodwoken?.getVersion();
};
