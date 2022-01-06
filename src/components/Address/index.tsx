import { CopyOutlined } from "@ant-design/icons";
import { Button, Input, Tooltip } from "antd";
import React, { useMemo } from "react";
import styled from "styled-components";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";

const TipWrapper = styled.div`
  color: #fff;
  .text-pair {
    display: flex;
    justify-content: space-between;
  }
`;

function truncateMiddle(str: string, first = 6, last = 4): string {
  return str.substring(0, first) + "..." + str.substring(str.length - last);
}

export const Address: React.FC = () => {
  const lightGodwoken = useLightGodwoken();

  const l2Address = useMemo(() => {
    if (!lightGodwoken) return undefined;
    return lightGodwoken.provider.getL2Address();
  }, [lightGodwoken]);

  if (!lightGodwoken || !l2Address) return null;
  const copyL1Address = () => {
    navigator.clipboard.writeText(lightGodwoken?.provider.getL1Address() || "");
  };
  const copyL2Address = () => {
    navigator.clipboard.writeText(lightGodwoken?.provider.getL2Address() || "");
  };
  return (
    <Tooltip
      title={
        <TipWrapper>
          <div className="address-content">
            <label htmlFor="">ETH ADDRESS</label>
            <Input.Group compact>
              <Input style={{ width: "calc(100% - 33px)" }} value={lightGodwoken.provider.getL2Address()} />
              <Tooltip title="copy git url">
                <Button icon={<CopyOutlined />} onClick={copyL2Address} />
              </Tooltip>
            </Input.Group>
          </div>
          {/* <div className="text-pair">
            <Text>L2 CKB Balance</Text>
            <Text>{getFullDisplayAmount(BigInt(l2CkbBalance), 8)}</Text>
          </div> */}
          <div className="address-content">
            <label htmlFor="">L1 WALLET ADDRESS</label>
            <Input.Group compact>
              <Input style={{ width: "calc(100% - 33px)" }} value={lightGodwoken.provider.getL1Address()} />
              <Tooltip title="copy git url">
                <Button icon={<CopyOutlined />} onClick={copyL1Address} />
              </Tooltip>
            </Input.Group>
          </div>
        </TipWrapper>
      }
    >
      {truncateMiddle(l2Address)}
    </Tooltip>
  );
};
