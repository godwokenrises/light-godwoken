import { message, Select } from "antd";
import styled from "styled-components";
import { PrimaryText, SecondeButton, Text } from "../../style/common";
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
  const handleChange = () => {};
  return (
    <StyleWrapper>
      <Select className="network-select" defaultValue="lucy" onChange={handleChange}>
        <Option value="jack">Jack</Option>
        <Option value="Yiminghe">yiminghe</Option>
      </Select>
      <SecondeButton>Connect</SecondeButton>
    </StyleWrapper>
  );
};
