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
  const lightGodwoken = useLightGodwoken();
  const decimals = lightGodwoken?.getNativeAsset().decimals;

  return (
    <StyleWrapper>
      <div className="first-row">
        <Text className="title">L1 Wallet Address</Text>
        <div className="copy" onClick={copyAddress}>
          <CopyIcon />
          <Text className="copy-text">Copy Address</Text>
        </div>
      </div>

      <PrimaryText className="address">{l1Address || <Placeholder />}</PrimaryText>
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
