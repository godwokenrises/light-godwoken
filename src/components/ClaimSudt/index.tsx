import { notification } from "antd";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { LightGodwokenNotFoundError } from "../../light-godwoken/constants/error";

export const ClaimSudt: React.FC = () => {
  const lightGodwoken = useLightGodwoken();

  const claimSudt = async () => {
    if (!lightGodwoken) {
      const message = "Please connect wallet first";
      notification.error({ message });
      throw new LightGodwokenNotFoundError("LightGodwoken Not Found!", message);
    }
    const txHash = await lightGodwoken.claimUSDC();
    notification.success({ message: `claim 1,000  USDC successful Tx: ${txHash}` });
  };
  return <div onClick={claimSudt}>Get 1,000 USD on L1</div>;
};
