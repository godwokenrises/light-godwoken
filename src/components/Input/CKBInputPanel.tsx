import { LoadingOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { getDisplayAmount, getFullDisplayAmount } from "../../utils/formatTokenAmount";
import NumericalInput from "./NumericalInput";
import { BI } from "@ckb-lumos/lumos";
import { parseStringToBI } from "../../utils/numberFormat";

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
  label?: string;
  maxAmount?: string;
  CKBBalance?: string;
  isLoading?: boolean;
  placeholder?: string;
}
export default function CKBInputPanel({
  value,
  onUserInput,
  label,
  CKBBalance,
  isLoading,
  maxAmount: inputMaxAmount,
  placeholder,
}: CKBInputPanelProps) {
  const [showMaxButton, setShowMaxButton] = useState(true);
  const maxAmount = inputMaxAmount || CKBBalance;
  useEffect(() => {
    if (value === "" && maxAmount === "") {
      return;
    }
    if (value === "" && maxAmount) {
      setShowMaxButton(!!BI.from(maxAmount).gt(0));
    }
    if (value && maxAmount) {
      if (BI.from(maxAmount).lte(0) || parseStringToBI(value, 8).eq(parseStringToBI(maxAmount))) {
        setShowMaxButton(false);
      } else {
        setShowMaxButton(true);
      }
    }
  }, [value, CKBBalance, maxAmount]);

  const handelMaxClick = () => {
    if (!maxAmount) {
      throw new Error("No maxAmount");
    }
    onUserInput(getFullDisplayAmount(BI.from(maxAmount), 18, { maxDecimalPlace: 18 }));
    setShowMaxButton(false);
  };
  return (
    <StyleWrapper>
      <Row className="first-row">
        <Typography.Text>{label}</Typography.Text>
        <Typography.Text>
          Balance:{" "}
          {isLoading || CKBBalance === undefined ? <LoadingOutlined /> : getDisplayAmount(BI.from(CKBBalance), 18)}
        </Typography.Text>
      </Row>
      <Row className="input-wrapper">
        <NumericalInput
          className="token-amount-input"
          value={value}
          placeholder={placeholder || "Minimum 400 CKB"}
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
