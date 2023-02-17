import React, { useEffect, useState } from "react";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { useParams } from "react-router-dom";
import { GodwokenVersion, LightGodwokenV1 } from "light-godwoken";
import { isMainnet } from "../../utils/environment";
import { addNetwork } from "../../utils/addNetwork";
import { Button } from "antd";
import styled from "styled-components";

const SimpleAlert = styled("div")`
  width: 100vw;
  padding: 16px 16px 0px 16px;
  background-color: #fff7ed;
  color: #f97316;
  display: flex;
  justify-content: center;
  align-items: center;

  .content {
    text-align: left;

    > p {
      margin-bottom: 10px;
      margin-right: 24px;
      display: inline-block;
    }

    > .ant-btn {
      margin-bottom: 16px;
      background-color: #f97316;
      color: #fffbeb;
      border: none;
      border-radius: 8px;
      font-weight: 600;

      &:hover {
        background-color: #fb923c;
      }
    }
  }
`;

export default function NetworkMismatchAlert() {
  const lightGodwoken = useLightGodwoken();
  const [displayNetworkName, setDisplayNetworkName] = useState("");
  const [visible, setVisible] = useState(false);
  const params = useParams();

  useEffect(() => {
    if (lightGodwoken instanceof LightGodwokenV1) {
      const ethereum = lightGodwoken.provider.ethereum;
      (ethereum.provider as any).provider.once?.("chainChanged", async (chainId: any) => {
        chainId = parseInt(chainId, 16);
        const godWokenChainId = parseInt(await lightGodwoken.getChainId(), 16);
        setVisible(!(chainId === godWokenChainId));
      });
      ethereum.provider.getNetwork().then(async (network) => {
        const chainId = network.chainId;
        const godWokenChainId = parseInt(await lightGodwoken.getChainId(), 16);
        if (godWokenChainId !== chainId) {
          const networkName = `Godwoken ${isMainnet ? "Mainnet" : "Testnet"}`;
          setDisplayNetworkName(networkName);
          setVisible(true);
        }
      });
    } else {
      setVisible(false);
    }
  }, [lightGodwoken, params]);

  const changeChain = () => {
    if (lightGodwoken instanceof LightGodwokenV1) {
      const ethereum = lightGodwoken.provider.ethereum;
      addNetwork(ethereum, lightGodwoken).then();
    }
  };

  return (
    <>
      {visible && params.version === GodwokenVersion.V1 && (
        <SimpleAlert>
          <div className={"content"}>
            <p>
              <b>Network mismatch:</b> The current network does not match. Do you want to switch to [{" "}
              <b>{displayNetworkName} </b>] ?
            </p>
            <Button onClick={changeChain}>Change network</Button>
          </div>
        </SimpleAlert>
      )}
    </>
  );
}
