import { CopyOutlined, LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { BI } from "@ckb-lumos/lumos";
import { Button, message, Modal, notification, Typography } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useLightGodwoken } from "../hooks/useLightGodwoken";
import CKBInputPanel from "../components/Input/CKBInputPanel";
import CurrencyInputPanel from "../components/Input/CurrencyInputPanel";
import { getDisplayAmount } from "../utils/formatTokenAmount";
import { Amount } from "@ckitjs/ckit/dist/helpers";
import { useSUDTBalance } from "../hooks/useSUDTBalance";
import { useL1CKBBalance } from "../hooks/useL1CKBBalance";
import { useL2CKBBalance } from "../hooks/useL2CKBBalance";
import { SUDT, Token } from "../light-godwoken/lightGodwokenType";
import { TransactionHistory } from "../components/TransactionHistory";
import { useL1TxHistory } from "../hooks/useL1TxHistory";
import { useChainId } from "../hooks/useChainId";
import { PageContent, Text } from "../style/common";
import { ReactComponent as PlusIcon } from "./../asserts/plus.svg";
import { WalletInfo } from "../components/WalletInfo";

const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
  a,
  .ant-typography {
    color: black;
  }
  .title {
    padding-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    > span {
      font-weight: bold;
      font-size: 18px;
      color: #333;
    }
  }
  .description {
    font-size: 12px;
    font-weight: bold;
    color: #333;
  }
`;
const PageMain = styled.div`
  padding: 24px;
  grid-auto-rows: auto;
  row-gap: 8px;
  .icon {
    width: 100%;
    display: flex;
    justify-content: center;
    padding-top: 8px;
    padding-bottom: 8px;
  }
`;
const WithdrawalButton = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: center;
  .submit-button {
    align-items: center;
    border: 0px;
    border-radius: 16px;
    box-shadow: rgb(14 14 44 / 40%) 0px -1px 0px 0px inset;
    cursor: pointer;
    display: inline-flex;
    font-family: inherit;
    font-size: 16px;
    font-weight: 600;
    -webkit-box-pack: center;
    justify-content: center;
    letter-spacing: 0.03em;
    line-height: 1;
    opacity: 1;
    outline: 0px;
    transition: background-color 0.2s ease 0s, opacity 0.2s ease 0s;
    height: 48px;
    padding: 0px 24px;
    background-color: rgb(255, 67, 66);
    color: black;
    width: 100%;
    &:disabled {
      background-color: rgb(60, 55, 66);
      border-color: rgb(60, 55, 66);
      box-shadow: none;
      color: rgb(104, 102, 123);
      cursor: not-allowed;
    }
  }
  button:hover {
    cursor: pointer;
  }
`;
const ConfirmModal = styled(Modal)`
  color: black;
  .ant-modal-content {
    border-radius: 32px;
    background: white;
    box-shadow: rgb(14 14 44 / 10%) 0px 20px 36px -8px, rgb(0 0 0 / 5%) 0px 1px 1px;
    border: 1px solid white;
    color: black;
  }
  .ant-modal-header {
    background: white;
    border: 1px solid white;
    border-top-left-radius: 32px;
    border-top-right-radius: 32px;
    padding: 12px 24px;
    height: 73px;
    display: flex;
    align-items: center;
  }
  .ant-modal-title,
  .ant-list-item {
    color: black;
  }
  .ant-modal-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .ant-modal-close-x {
    color: black;
  }
  .ant-typography {
    color: black;
    justify-content: space-between;
  }
  .tips {
    margin: 24px 0;
  }
  .anticon-loading {
    font-size: 50px;
    color: rgb(255, 67, 66);
  }
  .icon-container {
    padding-bottom: 20px;
  }
`;

export default function Deposit() {
  const [CKBInput, setCKBInput] = useState("");
  const [sudtInput, setSudtInputValue] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCKBValueValidate, setIsCKBValueValidate] = useState(true);
  const [isSudtValueValidate, setIsSudtValueValidate] = useState(true);
  const [selectedSudt, setSelectedSudt] = useState<SUDT>();
  const [selectedSudtBalance, setSelectedSudtBalance] = useState<string>();
  const lightGodwoken = useLightGodwoken();
  const sudtBalanceQUery = useSUDTBalance();
  const CKBBalanceQuery = useL1CKBBalance();
  const CKBBalance = CKBBalanceQuery.data;
  const { data: l2CKBBalance } = useL2CKBBalance();

  const maxAmount = CKBBalance ? BI.from(CKBBalance).toString() : undefined;
  const tokenList: SUDT[] | undefined = lightGodwoken?.getBuiltinSUDTList();
  const l1Address = lightGodwoken?.provider.getL1Address();
  const { data: chainId } = useChainId();
  const { addTxToHistory } = useL1TxHistory(`${chainId}/${l1Address}/deposit`);

  const showModal = async () => {
    if (lightGodwoken) {
      const capacity = Amount.from(CKBInput, 8).toHex();
      let amount = "0x0";
      if (selectedSudt && sudtInput) {
        amount = "0x" + Amount.from(sudtInput, selectedSudt.decimals).toString(16);
      }
      setIsModalVisible(true);
      try {
        const hash = await lightGodwoken.deposit({
          capacity: capacity,
          amount: amount,
          sudtType: selectedSudt?.type,
        });

        addTxToHistory({
          type: "deposit",
          txHash: hash,
          capacity,
          amount,
          symbol: selectedSudt?.symbol,
          decimals: selectedSudt?.decimals,
        });
        notification.success({ message: `deposit Tx(${hash}) is successful` });
      } catch (e) {
        if (e instanceof Error) {
          if (e.message.startsWith("Not enough CKB:")) {
            notification.error({
              message: e.message,
            });
          } else if (e.message.startsWith("Not enough SUDT:")) {
            notification.error({
              message: e.message,
            });
          }
        }
      }
      setIsModalVisible(false);
    }
  };

  const inputError = useMemo(() => {
    if (CKBInput === "") {
      return "Enter CKB Amount";
    }
    if (Amount.from(CKBInput, 8).lt(Amount.from(400, 8))) {
      return "Minimum 400 CKB";
    }
    if (CKBBalance && Amount.from(CKBInput, 8).gt(Amount.from(CKBBalance))) {
      return "Insufficient CKB Amount";
    }
    if (
      sudtInput &&
      selectedSudtBalance &&
      Amount.from(sudtInput, selectedSudt?.decimals).gt(Amount.from(selectedSudtBalance))
    ) {
      return `Insufficient ${selectedSudt?.symbol} Amount`;
    }
    return void 0;
  }, [CKBInput, CKBBalance, sudtInput, selectedSudtBalance, selectedSudt?.decimals, selectedSudt?.symbol]);

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  useEffect(() => {
    if (CKBInput === "" || CKBBalance === undefined) {
      setIsCKBValueValidate(false);
    } else if (
      Amount.from(CKBInput, 8).gte(Amount.from(400, 8)) &&
      Amount.from(CKBInput, 8).lte(Amount.from(CKBBalance))
    ) {
      setIsCKBValueValidate(true);
    } else {
      setIsCKBValueValidate(false);
    }
  }, [CKBBalance, CKBInput]);

  useEffect(() => {
    if (
      sudtInput &&
      selectedSudtBalance &&
      Amount.from(sudtInput, selectedSudt?.decimals).gt(Amount.from(selectedSudtBalance))
    ) {
      setIsSudtValueValidate(false);
    } else {
      setIsSudtValueValidate(true);
    }
  }, [sudtInput, selectedSudtBalance, selectedSudt?.decimals]);

  const handleSelectedChange = (value: Token, balance: string) => {
    setSelectedSudt(value as SUDT);
    setSelectedSudtBalance(balance);
  };

  return (
    <>
      <PageContent>
        <PageHeader className="header">
          <Text className="title">
            <span>Deposit To Layer2</span>
            <TransactionHistory type="deposit"></TransactionHistory>
          </Text>
          <Text className="description">
            To deposit, transfer CKB or supported sUDT tokens to your L1 Wallet Address first
          </Text>
        </PageHeader>
        <WalletInfo l1Address={l1Address} l1Balance={CKBBalance} l2Balance={l2CKBBalance}></WalletInfo>
        <PageMain className="main">
          <CKBInputPanel
            value={CKBInput}
            onUserInput={setCKBInput}
            label="Deposit"
            isLoading={CKBBalanceQuery.isLoading}
            CKBBalance={CKBBalance}
            maxAmount={maxAmount}
          ></CKBInputPanel>
          <div className="icon">
            <PlusIcon />
          </div>
          <CurrencyInputPanel
            value={sudtInput}
            onUserInput={setSudtInputValue}
            label="sUDT(optional)"
            onSelectedChange={handleSelectedChange}
            balancesList={sudtBalanceQUery.data?.balances}
            tokenList={tokenList}
            dataLoading={sudtBalanceQUery.isLoading}
          ></CurrencyInputPanel>
          <WithdrawalButton>
            <Button
              className="submit-button"
              disabled={!CKBInput || !isCKBValueValidate || !isSudtValueValidate}
              onClick={showModal}
            >
              {inputError || "Deposit"}
            </Button>
          </WithdrawalButton>
        </PageMain>
      </PageContent>
      <ConfirmModal title="Confirm Transaction" visible={isModalVisible} onCancel={handleCancel} footer={null}>
        <div className="icon-container">
          <LoadingOutlined />
        </div>
        <Text>Waiting For Confirmation</Text>
        <Text>
          Depositing {sudtInput} {selectedSudt?.symbol} and {CKBInput} CKB
        </Text>
        <div className="tips">Confirm this transaction in your wallet</div>
      </ConfirmModal>
    </>
  );
}
