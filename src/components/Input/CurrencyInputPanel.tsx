import styled from "styled-components";
import { List } from "antd";
import { FixedHeightRow } from "../Withdrawal/WithdrawalRequestCard";
import NumericalInput from "./NumericalInput";
import { DownOutlined, LoadingOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { getFullDisplayAmount } from "../../utils/formatTokenAmount";
import { Token } from "../../light-godwoken/lightGodwokenType";
import { BI } from "@ckb-lumos/lumos";
import { ConfirmModal, InputCard, Row, Text } from "../../style/common";
import { formatToThousands } from "../../utils/numberFormat";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";

const TokenList = styled.div`
  height: 390px;
  overflow-y: auto;
  width: 100%;
  .currency-item {
    width: 100%;
    .info {
      display: flex;
      flex-direction: row;
      align-items: center;
    }
    .icon {
      width: 24px;
      height: 24px;
      margin-right: 10px;
    }
    .symbol-name {
      display: flex;
      flex-direction: column;
      .symbol {
        font-size: 16px;
        font-weight: 600;
        line-height: 1.5;
      }
      .name {
        font-size: 14px;
        line-height: 1.5;
      }
    }
  }
  .ant-list-item {
    border-bottom: none;
    height: 56px;
    padding: 12px;
    border-radius: 10px;
    &:hover {
      background-color: #f3f3f3;
      cursor: pointer;
    }
    &.selected {
      background-color: #f3f3f3;
    }
  }
`;
const CurrencyWrapper = styled.div`
  display: flex;
  align-items: center;
  .select {
    padding-left: 5px;
  }
  &:hover {
    cursor: pointer;
  }
`;
interface CurrencyInputPanelProps {
  value: string;
  onUserInput: (value: string) => void;
  label?: string;
  autoFocus?: boolean;
  balancesList: string[] | undefined;
  tokenList: Token[] | undefined;
  dataLoading: boolean;
  onSelectedChange: (value: Token, balance: string) => void;
}
export default function CurrencyInputPanel({
  autoFocus,
  value,
  onUserInput,
  label,
  balancesList,
  tokenList,
  dataLoading,
  onSelectedChange,
}: CurrencyInputPanelProps) {
  const lightGodwoken = useLightGodwoken();
  const [selectedCurrencyBalance, setCurrencyBalance] = useState<string>();
  const [selectedCurrency, setSelectedCurrency] = useState<Token>();
  const [disableInput, setDisableInput] = useState<boolean>(true);

  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    setCurrencyBalance(undefined);
    setSelectedCurrency(undefined);
    setDisableInput(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightGodwoken?.getVersion(), lightGodwoken?.provider.getL2Address()]);
  const handleOk = () => {
    setIsModalVisible(false);
  };

  const showCurrencySelectModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };
  const handleErc20Selected = (index: number, erc20: Token) => {
    setDisableInput(false);
    setSelectedCurrency(erc20);
    setIsModalVisible(false);
    onUserInput("");

    if (balancesList && balancesList.length && index !== undefined && erc20) {
      const balance = balancesList[index];
      onSelectedChange(erc20, balance);
      setCurrencyBalance(balance);
    }
  };
  const handelMaxClick = () => {
    if (selectedCurrencyBalance === undefined) {
      throw new Error("Currency Balance Not Found");
    }
    onUserInput(
      getFullDisplayAmount(BI.from(selectedCurrencyBalance), selectedCurrency?.decimals, {
        maxDecimalPlace: selectedCurrency?.decimals,
      }),
    );
  };
  return (
    <InputCard>
      <Row className="first-row">
        <Text>{label}</Text>
        <Text className="balance" onClick={selectedCurrency && handelMaxClick}>
          Max:{" "}
          {selectedCurrencyBalance
            ? formatToThousands(getFullDisplayAmount(BI.from(selectedCurrencyBalance), selectedCurrency?.decimals))
            : "-"}
        </Text>
      </Row>
      <Row className="second-row">
        <NumericalInput
          autoFocus={autoFocus}
          disabled={disableInput}
          placeholder={disableInput ? "Please Select sUDT First" : "0.0"}
          className="token-amount-input"
          value={value}
          decimal={selectedCurrency?.decimals}
          onUserInput={(val) => {
            onUserInput(val);
          }}
        />
        <CurrencyWrapper className="currency-wrapper" onClick={showCurrencySelectModal}>
          {selectedCurrency ? (
            <div className="currency-icon">
              <img className="ckb-logo" src={selectedCurrency.tokenURI} alt="" />
              <Text>{selectedCurrency.symbol}</Text>
            </div>
          ) : (
            <Text>Select Token </Text>
          )}
          <DownOutlined className="select" />
        </CurrencyWrapper>
      </Row>
      <ConfirmModal
        title="Select a Token"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
      >
        <TokenList className="token-list">
          <List
            dataSource={tokenList}
            renderItem={(erc20, index) => (
              <List.Item
                className={erc20.symbol === selectedCurrency?.symbol ? "selected" : ""}
                onClick={() => !dataLoading && handleErc20Selected(index, erc20)}
              >
                <FixedHeightRow className="currency-item">
                  <div className="info">
                    <img className="icon" src={erc20.tokenURI} alt="" />
                    <div className="symbol-name">
                      <Text className="symbol">{erc20.symbol}</Text>
                      <Text className="name">{erc20.name}</Text>
                    </div>
                  </div>
                  <div>
                    {dataLoading ? (
                      <LoadingOutlined />
                    ) : balancesList && balancesList[index] && balancesList[index] !== "0x0" ? (
                      formatToThousands(getFullDisplayAmount(BI.from(balancesList[index]), erc20.decimals))
                    ) : (
                      "-"
                    )}
                  </div>
                </FixedHeightRow>
              </List.Item>
            )}
          ></List>
        </TokenList>
      </ConfirmModal>
    </InputCard>
  );
}
