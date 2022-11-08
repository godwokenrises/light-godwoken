import { Select } from "antd";
import styled from "styled-components";
import { SecondeButton } from "../../style/common";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { availableVersions } from "../../utils/environment";
import { ConnectorModal } from "./connector";
import { connectors } from "./connectors";
import { URI_AVAILABLE } from "@web3-react/walletconnect";

const { Option } = Select;
const StyleWrapper = styled.div`
  display: flex;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.2);
  .network-select {
    flex: 1;
    margin-right: 16px;
  }
  button {
    width: 100px;
  }
`;

export const WalletConnect: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();

  const [openWalletSelector, setOpenWalletSelector] = useState<boolean>(false);
  const [version, setVersion] = useState<string>();
  const lightGodwoken = useLightGodwoken();

  useEffect(() => {
    if (params.version) {
      setVersion(params.version.toString());
    }
  }, [params.version]);

  // log URI when available
  useEffect(() => {
    connectors.walletConnect.instance.events.on(URI_AVAILABLE, (uri: string) => {
      console.log(`uri: ${uri}`);
    });
  }, []);
  // attempt to connect eagerly on mount
  useEffect(() => {
    connectors.injectedConnect.instance.connectEagerly().catch(() => {
      console.debug("Failed to connect eagerly to injectedConnect");
    });
    connectors.walletConnect.instance.connectEagerly().catch(() => {
      console.debug("Failed to connect eagerly to walletconnect");
    });
  }, []);

  const handleChange = (value: string) => {
    setVersion(value);
    navigate(`/${value}`);
  };

  const connect = () => {
    if (lightGodwoken) return;

    setOpenWalletSelector(!openWalletSelector);
  };

  if (lightGodwoken) return null;

  return (
    <StyleWrapper>
      <Select className="network-select" value={version} onChange={handleChange}>
        {availableVersions.map((version) => (
          <Option value={version} key={version}>
            Godwoken {version.toUpperCase()}
          </Option>
        ))}
      </Select>
      <SecondeButton className="connect-wallet" onClick={connect}>
        Connect
      </SecondeButton>
      <ConnectorModal
        connectBtnQuerySelector=".connect-wallet"
        popoverVisible={openWalletSelector}
        setPopoverVisible={setOpenWalletSelector}
      ></ConnectorModal>
    </StyleWrapper>
  );
};
