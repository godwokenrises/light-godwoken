import { Typography, Radio, RadioChangeEvent } from "antd";
import React from "react";
import styled from "styled-components";

const StyleWrapper = styled.div`
  font-size: 14px;
  border-radius: 16px;
  background-color: rgb(60, 58, 75);
  box-shadow: rgb(74 74 104 / 10%) 0px 2px 2px -1px;
  margin-bottom: 20px;
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

  padding: 0.75rem 1rem;
  .ant-typography {
    color: white;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
  }
  .ant-radio-wrapper {
    color: #fff;
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
      <Row>
        <Typography.Text>Withdrawal Target</Typography.Text>
      </Row>
      <Row>
        <Radio.Group onChange={onChange} value={value}>
          <Radio value={"CKB_L1"}>CKB L1</Radio>
          <Radio value={"GodWoken_V1"}>GodWoken V1</Radio>
        </Radio.Group>
      </Row>
    </StyleWrapper>
  );
}
