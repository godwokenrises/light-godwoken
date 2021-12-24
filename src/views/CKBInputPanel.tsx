import { Typography } from "antd";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useLightGodwoken } from "../hooks/useLightGodwoken";
import { getDisplayAmount } from "../utils/formatTokenAmount";
import NumericalInput from "./NumericalInput";

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
}
export default function CKBInputPanel({ value, onUserInput, label }: CKBInputPanelProps) {
  const [showMaxButton, setShowMaxButton] = useState(true);
  const [l2CkbBalance, setL2CkbBalance] = useState("");
  const lightGodwoken = useLightGodwoken();

  useEffect(() => {
    const fetchData = async () => {
      const balance = (await lightGodwoken?.getL2CkbBalance()) || "";
      setL2CkbBalance(balance);
    };
    fetchData();
  }, [lightGodwoken]);

  useEffect(() => {
    if (value !== getDisplayAmount(BigInt(l2CkbBalance), 8)) {
      setShowMaxButton(true);
    } else {
      setShowMaxButton(false);
    }
  }, [value, l2CkbBalance]);

  const handelMaxClick = () => {
    onUserInput(getDisplayAmount(BigInt(l2CkbBalance), 8));
    setShowMaxButton(false);
  };
  return (
    <StyleWrapper>
      <Row className="first-row">
        <Typography.Text>{label}</Typography.Text>
        <Typography.Text>Balance: {getDisplayAmount(BigInt(l2CkbBalance), 8) || ""}</Typography.Text>
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
