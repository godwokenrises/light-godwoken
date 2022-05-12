import { notification } from "antd";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";

export const ClaimSudt: React.FC = () => {
  const lightGodwoken = useLightGodwoken();

  const claimSudt = async () => {
    if (!lightGodwoken) {
      throw new Error("LightGodwoken Not Found!");
    }
    const txHash = await lightGodwoken.claimUSDC();
    notification.success({ message: `claim 1,000  USDC successful Tx: ${txHash}` });
  };
  return <div onClick={claimSudt}>Get 1,000 USDC</div>;
};
