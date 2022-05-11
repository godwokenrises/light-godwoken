import { Select } from "antd";
import styled from "styled-components";
import { SecondeButton } from "../../style/common";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { useEffect, useState } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import { useNavigate, useParams } from "react-router-dom";
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
  .first-row {
    display: flex;
    justify-content: space-between;
  }

  .address {
    margin-top: 10px;
  }
  .copy {
    svg {
      margin-right: 4px;
    }
    .copy-text {
      color: #00cc98;
    }
    &:hover {
      cursor: pointer;
    }
  }
`;

export const WalletConnect: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();

  const [version, setVersion] = useState("v0");
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
      <Select className="network-select" defaultValue={version} onChange={handleChange}>
        <Option value="v0">Godwoken V0</Option>
        <Option value="v1">Godwoken V1</Option>
      </Select>
      <SecondeButton onClick={connect}>Connect</SecondeButton>
    </StyleWrapper>
  );
};
