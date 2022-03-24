import { LoadingOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useLightGodwoken } from "../hooks/useLightGodwoken";
import { getDisplayAmount, getFullDisplayAmount } from "../utils/formatTokenAmount";
import NumericalInput from "./NumericalInput";
import { useQuery } from "react-query";
import { useCKBBalance } from "../hooks/useCKBBalance";

const StyleWrapper = styled.div`
  font-size: 14px;
  border-radius: 16px;
  background-color: rgb(60, 58, 75);
  box-shadow: rgb(74 74 104 / 10%) 0px 2px 2px -1px;
  .first-row {
    margin-bottom: 3px;
    padding: 0.75rem 1rem 0px;
  }
  .anticon {
    font-size: 12px;
  }

  .input-wrapper {
    padding: 0.75rem 0.5rem 0.75rem 1rem;
  }
`;
const Row = styled.div`
  display: flex;
  justify-content: space-between;
  .ant-typography {
    color: white;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
  }
  .ckb-logo {
    height: 24px;
    width: 24px;
    margin-right: 8px;
  }
  .max-button {
    height: 32px;
    padding: 0px 16px;
    background-color: transparent;
    color: rgb(255, 67, 66);
    font-weight: 600;
    &:hover {
      cursor: pointer;
    }
  }
`;

interface CKBInputPanelProps {
  value: string;
  onUserInput: (value: string) => void;
  isL1?: boolean;
  isDeposit?: boolean;
  label?: string;
}
export default function CKBInputPanel({ value, onUserInput, label, isL1, isDeposit }: CKBInputPanelProps) {
  const [showMaxButton, setShowMaxButton] = useState(true);
  const query = useCKBBalance(!!isL1);
  
  const ckbBalance = query.data || "";
  useEffect(() => {
    if (value !== getDisplayAmount(BigInt(ckbBalance), 8)) {
      setShowMaxButton(true);
    } else {
      setShowMaxButton(false);
    }
  }, [value, ckbBalance]);

  const handelMaxClick = () => {
    const maxAmount = isDeposit ? BigInt(ckbBalance) - BigInt(6500000000) : BigInt(ckbBalance);
    onUserInput(getDisplayAmount(maxAmount, 8));
    setShowMaxButton(false);
  };
  return (
    <StyleWrapper>
      <Row className="first-row">
        <Typography.Text>{label}</Typography.Text>
        <Typography.Text>
          Balance: {query.isLoading ? <LoadingOutlined /> : getDisplayAmount(BigInt(ckbBalance), 8)}
        </Typography.Text>
      </Row>
      <Row className="input-wrapper">
        <NumericalInput
          className="token-amount-input"
          value={value}
          placeholder="Minimum 400 CKB"
          onUserInput={(val) => {
            onUserInput(val);
          }}
        />
        {showMaxButton && (
          <Typography.Text className="max-button" onClick={handelMaxClick}>
            MAX
          </Typography.Text>
        )}
        <img className="ckb-logo" src="./static/ckb.svg" alt="" />
        <Typography.Text>CKB</Typography.Text>
      </Row>
    </StyleWrapper>
  );
}
