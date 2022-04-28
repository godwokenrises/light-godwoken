import { LoadingOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { getDisplayAmount, getFullDisplayAmount } from "../../utils/formatTokenAmount";
import NumericalInput from "./NumericalInput";
import { Amount } from "@ckitjs/ckit/dist/helpers";
import { BI } from "@ckb-lumos/lumos";
import { InputCard, Text, Row } from "../../style/common";

interface CKBInputPanelProps {
  value: string;
  onUserInput: (value: string) => void;
  label?: string;
  maxAmount?: string;
  CKBBalance?: string;
  isLoading?: boolean;
}
export default function CKBInputPanel({
  value,
  onUserInput,
  label,
  CKBBalance,
  isLoading,
  maxAmount: inputMaxAmount,
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
      if (BI.from(maxAmount).lte(0) || Amount.from(value, 8).eq(Amount.from(maxAmount))) {
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
    onUserInput(getFullDisplayAmount(BI.from(maxAmount), 8, { maxDecimalPlace: 8 }));
    setShowMaxButton(false);
  };
  return (
    <InputCard>
      <Row className="first-row">
        <Text>{label}</Text>
        <Text className="balance" onClick={handelMaxClick}>
          Max: {isLoading || CKBBalance === undefined ? <LoadingOutlined /> : getDisplayAmount(BI.from(CKBBalance), 8)}
        </Text>
      </Row>
      <Row className="second-row">
        <NumericalInput
          className="token-amount-input"
          value={value}
          placeholder="Minimum 400 CKB"
          onUserInput={(val) => {
            onUserInput(val);
          }}
        />
        <img className="ckb-logo" src="./static/ckb.svg" alt="" />
        <Text className="symbol">CKB</Text>
      </Row>
    </InputCard>
  );
}
