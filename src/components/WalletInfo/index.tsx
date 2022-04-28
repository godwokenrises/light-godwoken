import { message } from "antd";
import styled from "styled-components";
import { PrimaryText, Text } from "../../style/common";
import { ReactComponent as CopyIcon } from "../../asserts/copy.svg";
import { LoadingOutlined } from "@ant-design/icons";
import { getDisplayAmount } from "../../utils/formatTokenAmount";
import { BI } from "@ckb-lumos/lumos";

const StyleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 24px 24px 24px;
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  .title {
    font-weight: bold;
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

const BalanceRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
`;
type Props = {
  l1Address: string | undefined;
  l1Balance: string | undefined;
  l2Balance: string | undefined;
};

export const WalletInfo: React.FC<Props> = ({ l1Address, l1Balance, l2Balance }) => {
  const copyAddress = () => {
    navigator.clipboard.writeText(l1Address || "");
    message.success("copied L1 address to clipboard");
  };
  return (
    <StyleWrapper>
      <div className="first-row">
        <Text className="title">L1 Wallet Address</Text>
        <div className="copy" onClick={copyAddress}>
          <CopyIcon />
          <Text className="copy-text">Copy Address</Text>
        </div>
      </div>

      <PrimaryText className="address">{l1Address}</PrimaryText>
      <BalanceRow>
        <Text className="title">L1 Balance</Text>
        <PrimaryText>{l1Balance ? getDisplayAmount(BI.from(l1Balance), 8) + "CKB" : <LoadingOutlined />}</PrimaryText>
      </BalanceRow>
      <BalanceRow>
        <Text className="title">L2 Balance</Text>
        <PrimaryText>{l2Balance ? getDisplayAmount(BI.from(l2Balance), 8) + "CKB" : <LoadingOutlined />}</PrimaryText>
      </BalanceRow>
    </StyleWrapper>
  );
};
