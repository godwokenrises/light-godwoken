import { useContext } from "react";
import { LightGodwokenContext } from "../contexts/LightGodwokenContext";
import { LightGodwoken } from "../light-godwoken";

export const useLightGodwoken = (): LightGodwoken | null => {
  const lightGodwoken = useContext(LightGodwokenContext);

  return lightGodwoken;
};
