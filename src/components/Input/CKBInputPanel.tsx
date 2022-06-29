import React from "react";
import { getDisplayAmount, getFullDisplayAmount } from "../../utils/formatTokenAmount";
import NumericalInput from "./NumericalInput";
import { BI } from "@ckb-lumos/lumos";
import { InputCard, Text, Row } from "../../style/common";
import { ReactComponent as CKBIcon } from "../../assets/ckb.svg";
import { Placeholder } from "../Placeholder";
import { formatToThousands } from "../../utils/numberFormat";

interface CKBInputPanelProps {
  value: string;
  onUserInput: (value: string) => void;
  label?: string;
  maxAmount?: string;
  CKBBalance?: string;
  isLoading?: boolean;
  decimals?: number;
  placeholder?: string;
}
export default function CKBInputPanel({
  value,
  onUserInput,
  label,
  CKBBalance,
  isLoading,
  maxAmount: inputMaxAmount,
  decimals = 8,
  placeholder,
}: CKBInputPanelProps) {
  const maxAmount = inputMaxAmount || CKBBalance;

  const handelMaxClick = () => {
    if (!maxAmount) {
      throw new Error("No maxAmount");
    }
    onUserInput(getFullDisplayAmount(BI.from(maxAmount), decimals, { maxDecimalPlace: 8 }));
  };
  return (
    <InputCard>
      <Row className="first-row">
        <Text>{label}</Text>
        <Text className="balance" onClick={handelMaxClick}>
          Max: {CKBBalance ? formatToThousands(getDisplayAmount(BI.from(CKBBalance), decimals)) : <Placeholder />}
        </Text>
      </Row>
      <Row className="second-row">
        <NumericalInput
          className="token-amount-input"
          value={value}
          placeholder={placeholder || "Minimum 400 CKB"}
          onUserInput={(val) => {
            onUserInput(val);
          }}
        />
        <CKBIcon />
        <Text className="symbol">CKB</Text>
      </Row>
    </InputCard>
  );
}
