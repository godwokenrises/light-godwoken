import { LoadingOutlined } from "@ant-design/icons";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";

export const Placeholder: React.FC = () => {
  const lightGodwoken = useLightGodwoken();
  return <>{lightGodwoken ? <LoadingOutlined /> : "-"}</>;
};
