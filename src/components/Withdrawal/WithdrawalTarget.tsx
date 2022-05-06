import React from "react";
import { Radio, RadioChangeEvent } from "antd";
import styled from "styled-components";
import { CKB_L1, GODWOKEN_V1 } from "./const";
import { InputCard, Row, Text } from "../../style/common";

export const StyleWrapper = styled.div`
  margin-bottom: 24px;
  .ant-radio-wrapper {
    font-weight: bold;
  }
`;
interface WithdrawalTargetProps {
  value: string;
  onSelectedChange: (value: string) => void;
}

export default function WithdrawalTarget({ value, onSelectedChange }: WithdrawalTargetProps) {
  const onChange = (e: RadioChangeEvent) => {
    onSelectedChange(e.target.value);
  };

  return (
    <StyleWrapper>
      <InputCard>
        <Row className="first-row">
          <Text>Withdrawal Target</Text>
        </Row>
        <Row className="second-row">
          <Radio.Group onChange={onChange} value={value}>
            <Radio value={CKB_L1}>CKB L1</Radio>
            <Radio value={GODWOKEN_V1}>GodWoken V1</Radio>
          </Radio.Group>
        </Row>
      </InputCard>
    </StyleWrapper>
  );
}
