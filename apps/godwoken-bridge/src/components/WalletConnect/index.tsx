import { Select } from "antd";
import styled from "styled-components";
import { SecondeButton } from "../../style/common";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import React, { useEffect, useState } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import { useNavigate, useParams } from "react-router-dom";
import { availableVersions } from "../../utils/environment";
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

  const [version, setVersion] = useState<string>();
  const lightGodwoken = useLightGodwoken();

  useEffect(() => {
    if (params.version) {
      setVersion(params.version.toString());
    }
  }, [params.version]);

  const handleChange = (value: string) => {
    setVersion(value);
    navigate(`/${value}`);
  };

  const connect = () => {
    if (lightGodwoken) return;

    detectEthereumProvider().then((ethereum: any) => {
      return ethereum.request({ method: "eth_requestAccounts" });
    });
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
      <SecondeButton onClick={connect}>Connect</SecondeButton>
    </StyleWrapper>
  );
};
