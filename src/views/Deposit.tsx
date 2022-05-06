import { LoadingOutlined } from "@ant-design/icons";
import { BI } from "@ckb-lumos/lumos";
import { notification } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useLightGodwoken } from "../hooks/useLightGodwoken";
import CKBInputPanel from "../components/Input/CKBInputPanel";
import CurrencyInputPanel from "../components/Input/CurrencyInputPanel";
import { Amount } from "@ckitjs/ckit/dist/helpers";
import { useSUDTBalance } from "../hooks/useSUDTBalance";
import { useL1CKBBalance } from "../hooks/useL1CKBBalance";
import { useL2CKBBalance } from "../hooks/useL2CKBBalance";
import { SUDT, Token } from "../light-godwoken/lightGodwokenType";
import { TransactionHistory } from "../components/TransactionHistory";
import { useL1TxHistory } from "../hooks/useL1TxHistory";
import { useChainId } from "../hooks/useChainId";
import { ConfirmModal, Card, PlusIconContainer, PrimaryButton, Text, CardHeader } from "../style/common";
import { ReactComponent as PlusIcon } from "./../asserts/plus.svg";
import { WalletInfo } from "../components/WalletInfo";

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
      <Card>
        <CardHeader className="header">
          <Text className="title">
            <span>Deposit To Layer2</span>
            <TransactionHistory type="deposit"></TransactionHistory>
          </Text>
          <Text className="description">
            To deposit, transfer CKB or supported sUDT tokens to your L1 Wallet Address first
          </Text>
        </CardHeader>
        <WalletInfo l1Address={l1Address} l1Balance={CKBBalance} l2Balance={l2CKBBalance}></WalletInfo>
        <CKBInputPanel
          value={CKBInput}
          onUserInput={setCKBInput}
          label="Deposit"
          isLoading={CKBBalanceQuery.isLoading}
          CKBBalance={CKBBalance}
          maxAmount={maxAmount}
        ></CKBInputPanel>
        <PlusIconContainer>
          <PlusIcon />
        </PlusIconContainer>
        <CurrencyInputPanel
          value={sudtInput}
          onUserInput={setSudtInputValue}
          label="sUDT(optional)"
          onSelectedChange={handleSelectedChange}
          balancesList={sudtBalanceQUery.data?.balances}
          tokenList={tokenList}
          dataLoading={sudtBalanceQUery.isLoading}
        ></CurrencyInputPanel>
        <PrimaryButton disabled={!CKBInput || !isCKBValueValidate || !isSudtValueValidate} onClick={showModal}>
          {inputError || "Deposit"}
        </PrimaryButton>
      </Card>
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
