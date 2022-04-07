import { useContext } from "react";
import { LightGodwokenContext } from "../contexts/LightGodwokenContext";
import DefaultLightGodwoken from "../light-godwoken/lightGodwoken";
export const useLightGodwoken = (): DefaultLightGodwoken | undefined => {
  const lightGodwoken = useContext(LightGodwokenContext);
  return lightGodwoken;
};
