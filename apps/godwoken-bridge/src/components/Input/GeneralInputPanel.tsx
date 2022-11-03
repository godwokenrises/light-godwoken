import React, { ChangeEvent } from "react";
import { InputCard, Text, Row } from "../../style/common";
import styled from "styled-components";

const StyledInput = styled.input<{ error?: boolean; fontSize?: string; align?: string }>`
  padding: 0;
  width: 0;
  position: relative;
  font-weight: 500;
  outline: none;
  border: none;
  flex: 1 1 auto;
  background-color: transparent;
  font-size: 16px;
  text-align: ${({ align }) => align && align};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-appearance: textfield;

  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  [type="text"] {
    -moz-appearance: textfield;
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  :disabled {
    cursor: not-allowed;
  }
`;

export interface GeneralInputPanelProps {
  value: string;
  onUserInput: (value: string) => void;
  label?: string;
  maxAmount?: string;
  CKBBalance?: string;
  isLoading?: boolean;
  decimals?: number;
  placeholder?: string;
}

export default function GeneralInputPanel({
  value,
  onUserInput,
  label,
  isLoading,
  placeholder,
}: GeneralInputPanelProps) {
  function onInput(event: ChangeEvent<HTMLInputElement>) {
    onUserInput(event.target.value);
  }

  return (
    <InputCard>
      <Row className="first-row">
        <Text>{label}</Text>
      </Row>
      <Row className="second-row">
        <StyledInput
          className="token-amount-input"
          value={value}
          onInput={onInput}
          // text input options
          inputMode="text"
          title={label}
          autoComplete="off"
          autoCorrect="off"
          // text-specific options
          type="text"
          placeholder={placeholder}
          minLength={1}
          spellCheck="false"
        />
      </Row>
    </InputCard>
  );
}
