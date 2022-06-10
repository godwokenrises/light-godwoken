import { GodwokenVersion } from "../light-godwoken/lightGodwokenType";
import { useLightGodwoken } from "./useLightGodwoken";

export const useGodwokenVersion = (): GodwokenVersion | undefined => {
  const lightGodwoken = useLightGodwoken();
  return lightGodwoken?.getVersion();
};
