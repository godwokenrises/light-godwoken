import React from "react";
import { notification } from "antd";
import { claimUSDC } from "./sudtFaucet";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { LightGodwokenNotFoundError, NotEnoughCapacityError } from "light-godwoken";

export const ClaimSudt: React.FC = () => {
  const lightGodwoken = useLightGodwoken();

  const claimSudt = async () => {
    if (!lightGodwoken) {
      const message = "Please connect wallet first";
      notification.error({ message });
      throw new LightGodwokenNotFoundError("LightGodwoken Not Found!", message);
    }
    try {
      const txHash = await claimUSDC({
        ethAddress: lightGodwoken.provider.getL2Address(),
        config: lightGodwoken.provider.getConfig(),
        ethereum: lightGodwoken.provider.ethereum,
        rpc: lightGodwoken.provider.ckbRpc,
        indexer: lightGodwoken.provider.ckbIndexer,
      });
      notification.success({ message: `claim 1,000 TTKN successful Tx: ${txHash}` });
    } catch (error) {
      if (error instanceof NotEnoughCapacityError) {
        notification.error({ message: "Claim error, you need get some ckb first" });
        setTimeout(() => {
          window.open("https://faucet.nervos.org", "_blank");
        }, 3000);
      } else {
        throw error;
      }
    }
  };
  return <div onClick={claimSudt}>Get 1,000 Test Token(TTKN) on L1</div>;
};
