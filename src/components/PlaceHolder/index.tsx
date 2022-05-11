import { LoadingOutlined } from "@ant-design/icons";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";

export const PlaceHolder: React.FC = () => {
  const lightGodwoken = useLightGodwoken();
  return <>{lightGodwoken ? <LoadingOutlined /> : "-"}</>;
};
