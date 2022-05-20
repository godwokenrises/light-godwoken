import React, { useEffect, useMemo, useState } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import { BI } from "@ckb-lumos/lumos";
import { notification } from "antd";
import styled from "styled-components";
import { useLightGodwoken } from "../hooks/useLightGodwoken";
import CKBInputPanel from "../components/Input/CKBInputPanel";
import CurrencyInputPanel from "../components/Input/CurrencyInputPanel";
import { useSUDTBalance } from "../hooks/useSUDTBalance";
import { useL1CKBBalance } from "../hooks/useL1CKBBalance";
import { useL2CKBBalance } from "../hooks/useL2CKBBalance";
import { SUDT, Token } from "../light-godwoken/lightGodwokenType";
import { TransactionHistory } from "../components/TransactionHistory";
import { useL1TxHistory } from "../hooks/useL1TxHistory";
import { useChainId } from "../hooks/useChainId";
import {
  ConfirmModal,
  Card,
  PlusIconContainer,
  PrimaryButton,
  Text,
  CardHeader,
  MainText,
  InputInfo,
  LoadingWrapper,
  Tips,
} from "../style/common";
import { ReactComponent as PlusIcon } from "./../asserts/plus.svg";
import { WalletInfo } from "../components/WalletInfo";
import { getDepositInputError, isDepositCKBInputValidate, isSudtInputValidate } from "../utils/inputValidate";
import { formatToThousands, parseStringToBI } from "../utils/numberFormat";
import { ReactComponent as CKBIcon } from "../asserts/ckb.svg";
import { WalletConnect } from "../components/WalletConnect";
import { DepositList } from "../components/Deposit/List";

const ModalContent = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  const ethAddress = lightGodwoken?.provider.getL2Address();
  const { data: chainId } = useChainId();
  const { addTxToHistory } = useL1TxHistory(`${chainId}/${l1Address}/deposit`);

  const showModal = async () => {
    if (lightGodwoken) {
      const capacity = parseStringToBI(CKBInput, 8).toHexString();
      let amount = "0x0";
      if (selectedSudt && sudtInput) {
        amount = parseStringToBI(sudtInput, selectedSudt.decimals).toHexString();
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
    return getDepositInputError({
      CKBInput,
      CKBBalance,
      sudtValue: sudtInput,
      sudtBalance: selectedSudtBalance,
      sudtDecimals: selectedSudt?.decimals,
      sudtSymbol: selectedSudt?.symbol,
    });
  }, [CKBInput, CKBBalance, sudtInput, selectedSudtBalance, selectedSudt?.decimals, selectedSudt?.symbol]);

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  useEffect(() => {
    setIsCKBValueValidate(isDepositCKBInputValidate(CKBInput, CKBBalance));
  }, [CKBBalance, CKBInput]);

  useEffect(() => {
    setIsSudtValueValidate(isSudtInputValidate(sudtInput, selectedSudtBalance, selectedSudt?.decimals));
  }, [sudtInput, selectedSudtBalance, selectedSudt?.decimals]);

  const handleSelectedChange = (value: Token, balance: string) => {
    setSelectedSudt(value as SUDT);
    setSelectedSudtBalance(balance);
  };

  return (
    <>
      <Card>
        <WalletConnect></WalletConnect>
        <div style={{ opacity: lightGodwoken ? "1" : "0.5" }}>
          <CardHeader className="header">
            <Text className="title">
              <span>Deposit To Layer2</span>
              <TransactionHistory type="deposit"></TransactionHistory>
            </Text>
            <Text className="description">
              To deposit, transfer CKB or supported sUDT tokens to your L1 Wallet Address first
            </Text>
          </CardHeader>
          <WalletInfo
            l1Address={l1Address}
            l1Balance={CKBBalance}
            l2Balance={l2CKBBalance}
            ethAddress={ethAddress}
          ></WalletInfo>
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
        </div>
      </Card>
      <Card>
        <DepositList></DepositList>
      </Card>
      <ConfirmModal
        title="Confirm Transaction"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={400}
      >
        <ModalContent>
          <InputInfo>
            <span className="title">Depositing</span>
            <div className="amount">
              <div className="ckb-amount">
                <MainText>{formatToThousands(CKBInput)}</MainText>
                <div className="ckb-icon">
                  <CKBIcon></CKBIcon>
                </div>
                <MainText>CKB</MainText>
              </div>
              {sudtInput && (
                <div className="sudt-amount">
                  <MainText>{formatToThousands(sudtInput)}</MainText>
                  {selectedSudt?.tokenURI ? <img src={selectedSudt?.tokenURI} alt="" /> : ""}
                  <MainText>{selectedSudt?.symbol}</MainText>
                </div>
              )}
            </div>
          </InputInfo>

          <LoadingWrapper>
            <LoadingOutlined />
          </LoadingWrapper>
          <Tips>Waiting for User Confirmation</Tips>
        </ModalContent>
      </ConfirmModal>
    </>
  );
}
