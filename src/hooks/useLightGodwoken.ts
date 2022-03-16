import { useContext } from "react";
import { LightGodwokenContext } from "../contexts/LightGodwokenContext";
import {
  LightGodwokenV1 as DefaultLightGodwokenV1,
  LightGodwoken as DefaultLightGodwoken,
} from "../light-godwoken/index";
export const useLightGodwoken = (): DefaultLightGodwokenV1 | DefaultLightGodwoken | null => {
  const lightGodwoken = useContext(LightGodwokenContext);

  return lightGodwoken;
};
