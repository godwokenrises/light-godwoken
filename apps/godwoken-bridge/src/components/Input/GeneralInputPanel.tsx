import React, { ChangeEvent, ReactNode } from "react";
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
  // value
  value: string;
  onUserInput: (value: string) => void;
  // info
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  // slots
  appendLabel?: ReactNode;
  appendInput?: ReactNode;
  appendCard?: ReactNode;
}

export default function GeneralInputPanel(props: GeneralInputPanelProps) {
  function onInput(event: ChangeEvent<HTMLInputElement>) {
    props.onUserInput(event.target.value);
  }

  return (
    <InputCard>
      <Row className="first-row">
        <Text>{props.label}</Text>
        {props.appendLabel}
      </Row>
      <Row className="second-row">
        <StyledInput
          className="token-amount-input"
          value={props.value}
          onInput={onInput}
          disabled={props.disabled}
          // text input options
          inputMode="text"
          title={props.label}
          autoComplete="off"
          autoCorrect="off"
          // text-specific options
          type="text"
          placeholder={props.placeholder}
          minLength={1}
          spellCheck="false"
        />
        {props.appendInput}
      </Row>
      {props.appendCard}
    </InputCard>
  );
}
