import { useContext } from "react";
import { LightGodwokenContext } from "../contexts/LightGodwokenContext";
import { LightGodwoken as DefaultLightGodwoken } from "light-godwoken";
export const useLightGodwoken = (): DefaultLightGodwoken | undefined => {
  const lightGodwoken = useContext(LightGodwokenContext);
  return lightGodwoken;
};
export const useLightGodwokenVersion = (): string | undefined => {
  const lightGodwoken = useLightGodwoken();
  if (!lightGodwoken) {
    return undefined;
  }
  return lightGodwoken.getVersion();
};
