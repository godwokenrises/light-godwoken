import { message } from "antd";
import styled from "styled-components";
import { PrimaryText, Text } from "../../style/common";
import { ReactComponent as CopyIcon } from "../../asserts/copy.svg";
import { getDisplayAmount } from "../../utils/formatTokenAmount";
import { BI } from "@ckb-lumos/lumos";
import { Placeholder } from "../Placeholder";
import { formatToThousands } from "../../utils/numberFormat";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";

const StyleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  .title {
    font-weight: bold;
  }
  .address-row {
    display: flex;
    justify-content: space-between;
    &.eth {
      margin-top: 16px;
    }
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
  ethAddress: string | undefined;
};

export const WalletInfo: React.FC<Props> = ({ l1Address, l1Balance, l2Balance, ethAddress }) => {
  const truncateMiddle = (str: string, first = 40, last = 6): string => {
    return str.substring(0, first) + "..." + str.substring(str.length - last);
  };
  const copyAddress = () => {
    navigator.clipboard.writeText(l1Address || "");
    message.success("copied L1 address to clipboard");
  };

  const copyEthAddress = () => {
    navigator.clipboard.writeText(ethAddress || "");
    message.success("copied ethereum address to clipboard");
  };
  const lightGodwoken = useLightGodwoken();
  const decimals = lightGodwoken?.getNativeAsset().decimals;

  return (
    <StyleWrapper>
      <div className="address-row">
        <Text className="title">L1 Wallet Address</Text>
        <div className="copy" onClick={copyAddress}>
          <CopyIcon />
          <Text className="copy-text">Copy Address</Text>
        </div>
      </div>

      <PrimaryText className="address" title={l1Address}>
        {l1Address ? truncateMiddle(l1Address) : <Placeholder />}
      </PrimaryText>
      <div className="address-row eth">
        <Text className="title">Ethereum Address</Text>
        <div className="copy" onClick={copyEthAddress}>
          <CopyIcon />
          <Text className="copy-text">Copy Address</Text>
        </div>
      </div>

      <PrimaryText className="address" title={ethAddress}>
        {ethAddress ? truncateMiddle(ethAddress) : <Placeholder />}
      </PrimaryText>
      <BalanceRow>
        <Text className="title">L1 Balance</Text>
        <PrimaryText>
          {l1Balance ? formatToThousands(getDisplayAmount(BI.from(l1Balance), 8)) + " CKB" : <Placeholder />}
        </PrimaryText>
      </BalanceRow>
      <BalanceRow>
        <Text className="title">L2 Balance</Text>
        <PrimaryText>
          {l2Balance ? formatToThousands(getDisplayAmount(BI.from(l2Balance), decimals)) + " CKB" : <Placeholder />}
        </PrimaryText>
      </BalanceRow>
    </StyleWrapper>
  );
};
