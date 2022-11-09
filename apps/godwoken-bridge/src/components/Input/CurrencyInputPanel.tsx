import styled from "styled-components";
import { List, Tooltip } from "antd";
import { FixedHeightRow } from "../Withdrawal/WithdrawalItemV0";
import NumericalInput from "./NumericalInput";
import { DownOutlined, LoadingOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import React, { useEffect, useMemo, useState } from "react";
import { getFullDisplayAmount } from "../../utils/formatTokenAmount";
import { UniversalToken, translate } from "light-godwoken";
import { BI, HexNumber } from "@ckb-lumos/lumos";
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
  tokenList: UniversalToken[] | undefined;
  dataLoading: boolean;
  selected?: UniversalToken;
  onSelectedChange: (value: UniversalToken, balance: string) => void;
  extractBalance?: HexNumber;
}
export default function CurrencyInputPanel({
  autoFocus,
  value,
  onUserInput,
  label,
  balancesList,
  tokenList,
  dataLoading,
  selected,
  extractBalance,
  onSelectedChange,
}: CurrencyInputPanelProps) {
  const lightGodwoken = useLightGodwoken();
  const [selectedCurrencyBalance, setCurrencyBalance] = useState<string>();
  const [selectedCurrency, setSelectedCurrency] = useState<UniversalToken>();
  const [disableInput, setDisableInput] = useState<boolean>(true);

  const [isModalVisible, setIsModalVisible] = useState(false);

  const tokenListWithBalance: Array<UniversalToken & { balance: string }> = (tokenList || []).map((token, index) => {
    return {
      ...token,
      balance: (balancesList || [])[index],
    };
  });

  const tokenListWithBalanceSorted = tokenListWithBalance
    // sort token list by dict order
    .sort((a, b) => {
      return a.symbol.localeCompare(b.symbol);
    })
    // sort token list by token balance
    .sort((a, b) => {
      const aValue: BI = !!a.balance && a.balance !== "0x0" ? BI.from(a.balance) : BI.from(0);
      const bValue: BI = !!b.balance && b.balance !== "0x0" ? BI.from(b.balance) : BI.from(0);
      if (aValue.gt(0) && bValue.lte(0)) {
        return -1;
      } else {
        return 0;
      }
    });

  const selectedTokenWithBalance = useMemo(() => {
    if (!selected) return undefined;
    return tokenListWithBalanceSorted.find((row) => row.uan === selected.uan);
  }, [tokenListWithBalanceSorted, selected]);

  const availableBalance = useMemo(() => {
    const formattedBalance = BI.from(selectedTokenWithBalance?.balance || 0);
    if (!extractBalance) {
      return formattedBalance;
    }
    if (formattedBalance.gt(extractBalance)) {
      return formattedBalance.sub(extractBalance);
    }
    return BI.from("0");
  }, [selectedTokenWithBalance, extractBalance]);

  const availableFormattedBalance = useMemo(() => {
    return getFullDisplayAmount(availableBalance, selectedCurrency?.decimals, {
      maxDecimalPlace: selectedCurrency?.decimals,
    });
  }, [availableBalance, selectedCurrency?.decimals]);

  useEffect(() => {
    if (selectedTokenWithBalance) {
      setCurrencyBalance(availableBalance.toString());
      setSelectedCurrency(selected);
      setDisableInput(false);
    } else {
      setSelectedCurrency(undefined);
      setCurrencyBalance(undefined);
      setDisableInput(true);
    }
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    lightGodwoken?.provider.getL2Address(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    lightGodwoken?.getVersion(),
    selectedTokenWithBalance,
    availableBalance,
    selected,
  ]);

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const showCurrencySelectModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };
  const handleErc20Selected = (index: number, erc20: UniversalToken) => {
    setDisableInput(false);
    setSelectedCurrency(erc20);
    setIsModalVisible(false);
    onUserInput("");

    const tokenWithBalance = tokenListWithBalanceSorted[index];
    if (balancesList && balancesList.length && index !== undefined && erc20) {
      const balance = tokenWithBalance.balance;
      onSelectedChange(erc20, balance);
      setCurrencyBalance(balance);
    }
  };
  const handelMaxClick = () => {
    if (selectedCurrencyBalance === undefined) {
      throw new Error("Currency Balance Not Found");
    }
    onUserInput(availableFormattedBalance);
  };

  return (
    <InputCard>
      <Row className="first-row">
        <Text>{label}</Text>
        <Text className="balance" onClick={selectedCurrency && handelMaxClick}>
          Max: {selectedCurrencyBalance ? availableFormattedBalance : "-"}
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
              {!!selectedCurrency.tokenURI ? (
                <img className="ckb-logo" src={selectedCurrency.tokenURI} alt="" />
              ) : (
                <QuestionCircleOutlined style={{ width: 24, height: 24, marginRight: 10 }} />
              )}
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
            dataSource={tokenListWithBalanceSorted}
            renderItem={(tokenWithBalance, index) => (
              <List.Item
                className={tokenWithBalance.symbol === selectedCurrency?.symbol ? "selected" : ""}
                onClick={() => !dataLoading && handleErc20Selected(index, tokenWithBalance)}
              >
                <FixedHeightRow className="currency-item">
                  <div className="info">
                    {!!tokenWithBalance.tokenURI ? (
                      <img className="icon" src={tokenWithBalance.tokenURI} alt="" />
                    ) : (
                      <QuestionCircleOutlined style={{ width: 24, height: 24, marginRight: 10 }} />
                    )}
                    <Tooltip title={!!tokenWithBalance.uan && translate(tokenWithBalance.uan)}>
                      <div className="symbol-name">
                        <Text className="symbol">{tokenWithBalance.symbol}</Text>
                        <Text className="name">{tokenWithBalance.name}</Text>
                      </div>
                    </Tooltip>
                  </div>
                  <div>
                    {dataLoading ? (
                      <LoadingOutlined />
                    ) : tokenWithBalance.balance && tokenWithBalance.balance !== "0x0" ? (
                      formatToThousands(
                        getFullDisplayAmount(BI.from(tokenWithBalance.balance), tokenWithBalance.decimals, {
                          maxDecimalPlace: tokenWithBalance.decimals,
                        }),
                      )
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
