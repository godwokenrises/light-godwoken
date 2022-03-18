import styled from "styled-components";
import { Typography, Modal, List } from "antd";
import { FixedHeightRow } from "../components/Withdrawal/WithdrawalRequestCard";
import NumericalInput from "./NumericalInput";
import { DownOutlined } from "@ant-design/icons";
import React, { useState, useEffect } from "react";
import { L1MappedErc20 } from "../types/type";
import { getFullDisplayAmount } from "../utils/formatTokenAmount";
import { useLightGodwoken } from "../hooks/useLightGodwoken";
import { SUDT } from "../light-godwoken/lightGodwokenType";
import { Script } from "@ckb-lumos/lumos";
const { Text } = Typography;
const StyleWrapper = styled.div`
  border-radius: 16px;
  background-color: rgb(60, 58, 75);
  box-shadow: rgb(74 74 104 / 10%) 0px 2px 2px -1px;
  .first-row {
    margin-bottom: 3px;
  }
  .anticon {
    font-size: 12px;
  }
  .max-button {
    height: 32px;
    line-height: 32px;
    padding: 0px 16px;
    background-color: transparent;
    color: rgb(255, 67, 66);
    font-weight: 600;
  }
  .token-list {
    height: 390px;
    overflow-y: auto;
  }
  .first-row {
    margin-bottom: 3px;
    padding: 0.75rem 1rem 0px;
  }
  .input-wrapper {
    height: 56px;
    padding: 0.75rem 0.5rem 0.75rem 1rem;
    display: flex;
    align-items: center;
  }
  .currency-wrapper {
    display: flex;
    align-items: center;
  }
  .anticon {
    margin-left: 10px;
  }
`;

const TokenList = styled.div`
  height: 390px;
  overflow-y: auto;
`;

const TokenListModal = styled(Modal)`
  color: white;
  .ant-modal-content {
    border-radius: 32px;
    background: rgb(39, 37, 52);
    box-shadow: rgb(14 14 44 / 10%) 0px 20px 36px -8px, rgb(0 0 0 / 5%) 0px 1px 1px;
    border: 1px solid rgb(60, 58, 75);
    color: white;
  }
  .ant-modal-header {
    background: rgb(39, 37, 52);
    border: 1px solid rgb(60, 58, 75);
    border-top-left-radius: 32px;
    border-top-right-radius: 32px;
    padding: 12px 24px;
    height: 73px;
    display: flex;
    align-items: center;
  }
  .ant-modal-title,
  .ant-list-item {
    color: white;
  }
  .ant-modal-body {
    padding: 0px;
  }
  .ant-modal-close-x {
    color: white;
  }
  .ant-list-item {
    border-bottom: none;
    padding: 4px 20px;
    height: 56px;
    &:hover {
      background-color: rgb(60, 58, 75);
      cursor: pointer;
    }
    &.selected {
      background-color: rgb(60, 58, 75);
    }
  }
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
  }
`;
interface Token {
  name: string;
  symbol: string;
  decimals: number;
  tokenURI: string;
}

interface CurrencyInputPanelProps {
  value: string;
  onUserInput: (value: string) => void;
  label?: string;
  disableCurrencySelect?: boolean;
  hideBalance?: boolean;
  hideInput?: boolean;
  showCommonBases?: boolean;
  disableInput?: boolean;
  autoFocus?: boolean;
  transparent?: boolean;
  isL1?: boolean;
  onSelectedChange: (value: Token) => void;
}
export default function CurrencyInputPanel({
  autoFocus,
  disableInput,
  value,
  onUserInput,
  label,
  isL1,
  onSelectedChange,
}: CurrencyInputPanelProps) {
  const [selectedCurrencyBalance, setCurrencyBalance] = useState("");
  const [showMaxButton, setShowMaxButton] = useState(false);
  const [tokenList, setTokenList] = useState<Token[]>();
  const [balancesList, setBalancesList] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Token>();
  const [selectedIndex, setSelectedIndex] = useState<number>();
  const lightGodwoken = useLightGodwoken();
  const showCurrencySelectModal = () => {
    setIsModalVisible(true);
  };
  const [isModalVisible, setIsModalVisible] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      if (lightGodwoken) {
        if (isL1) {
          const tokenList: SUDT[] = lightGodwoken.getBuiltinSUDTList();
          setTokenList(tokenList);
          const types: Script[] = tokenList.map((token) => token.type);
          const balances = await lightGodwoken.getSudtBalances({ types });
          setBalancesList(balances.balances);
        } else {
          const results: L1MappedErc20[] = lightGodwoken.getBuiltinErc20List();
          setTokenList(results);
          const addressList = results.map((erc20) => erc20.address);
          const balances = await lightGodwoken.getErc20Balances({ addresses: addressList });
          setBalancesList(balances.balances);
        }
      }
    };
    fetchData();
  }, [lightGodwoken, isL1]);

  useEffect(() => {
    if (selectedCurrency && (value !== selectedCurrencyBalance || value === "")) {
      setShowMaxButton(true);
    } else {
      setShowMaxButton(false);
    }
  }, [value, selectedCurrencyBalance, selectedCurrency]);

  useEffect(() => {
    if (balancesList && balancesList.length && selectedIndex !== undefined && selectedCurrency) {
      const balance = balancesList[selectedIndex];
      const currencyBalance = getFullDisplayAmount(BigInt(balance), selectedCurrency.decimals);
      setCurrencyBalance(currencyBalance);
    }
  }, [selectedIndex, balancesList, selectedCurrency]);

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };
  const handleErc20Selected = (index: number, erc20: Token) => {
    setSelectedCurrency(erc20);
    onSelectedChange(erc20);
    setIsModalVisible(false);
    setShowMaxButton(true);
    onUserInput("");
    setSelectedIndex(index);
  };
  const handelMaxClick = () => {
    onUserInput(selectedCurrencyBalance);
    setShowMaxButton(false);
  };
  return (
    <StyleWrapper>
      <Row className="first-row">
        <Typography.Text>{label}</Typography.Text>
        <Typography.Text>{selectedCurrencyBalance || ""}</Typography.Text>
      </Row>
      <Row className="input-wrapper">
        <NumericalInput
          autoFocus={autoFocus}
          disabled={disableInput}
          className="token-amount-input"
          value={value}
          onUserInput={(val) => {
            onUserInput(val);
          }}
        />
        {showMaxButton && (
          <div className="max-button" onClick={handelMaxClick}>
            MAX
          </div>
        )}
        <div className="currency-wrapper" onClick={showCurrencySelectModal}>
          {selectedCurrency ? (
            <div className="currency-icon">
              <img className="ckb-logo" src={selectedCurrency.tokenURI} alt="" />
              <Typography.Text>{selectedCurrency.symbol}</Typography.Text>
            </div>
          ) : (
            <Text>Select a currency </Text>
          )}
          <DownOutlined />
        </div>
      </Row>
      <TokenListModal
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
                onClick={() => handleErc20Selected(index, erc20)}
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
                    {balancesList.length ? getFullDisplayAmount(BigInt(balancesList[index]), erc20.decimals) : ""}
                  </div>
                </FixedHeightRow>
              </List.Item>
            )}
          ></List>
        </TokenList>
      </TokenListModal>
    </StyleWrapper>
  );
}
