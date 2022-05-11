import { LoadingOutlined } from "@ant-design/icons";
import { BI } from "@ckb-lumos/lumos";
import { notification } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useLightGodwoken, useLightGodwokenVersion } from "../hooks/useLightGodwoken";
import CKBInputPanel from "../components/Input/CKBInputPanel";
import CurrencyInputPanel from "../components/Input/CurrencyInputPanel";
import { useSUDTBalance } from "../hooks/useSUDTBalance";
import { useL1CKBBalance } from "../hooks/useL1CKBBalance";
import { useL2CKBBalance } from "../hooks/useL2CKBBalance";
import { SUDT, Token } from "../light-godwoken/lightGodwokenType";
import { TransactionHistory } from "../components/TransactionHistory";
import { useL1TxHistory } from "../hooks/useL1TxHistory";
import { useChainId } from "../hooks/useChainId";
import { ConfirmModal, Card, PlusIconContainer, PrimaryButton, Text, CardHeader, MainText } from "../style/common";
import { ReactComponent as PlusIcon } from "./../asserts/plus.svg";
import { WalletInfo } from "../components/WalletInfo";
import { getDepositInputError, isDepositCKBInputValidate, isSudtInputValidate } from "../utils/inputValidate";
import { parseStringToBI } from "../utils/numberFormat";
import { ReactComponent as CKBIcon } from "../asserts/ckb.svg";
import { WalletConnect } from "../components/WalletConnect";
const ConfirmInfo = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  .title {
    font-size: 14px;
    color: #333;
    font-weight: bold;
  }
  .amount {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: end;
    img,
    svg {
      width: 22px;
      height: 22px;
      margin: 0 10px 0 16px;
    }
    .ckb-amount {
      display: flex;
    }
    .ckb-amount + .sudt-amount {
      margin-top: 10px;
    }
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
  const lightGodwokenVersion = useLightGodwokenVersion();
  const sudtBalanceQUery = useSUDTBalance();
  const CKBBalanceQuery = useL1CKBBalance();
  const l2CKBBalanceQuery = useL2CKBBalance();
  const CKBBalance = CKBBalanceQuery.data;
  const { data: l2CKBBalance } = useL2CKBBalance();

  const maxAmount = CKBBalance ? BI.from(CKBBalance).toString() : undefined;
  const tokenList: SUDT[] | undefined = lightGodwoken?.getBuiltinSUDTList();
  const l1Address = lightGodwoken?.provider.getL1Address();
  const { data: chainId } = useChainId();
  const { addTxToHistory } = useL1TxHistory(`${chainId}/${l1Address}/deposit`);

  useEffect(() => {
    CKBBalanceQuery.remove();
    CKBBalanceQuery.refetch();
    l2CKBBalanceQuery.remove();
    l2CKBBalanceQuery.refetch();
    sudtBalanceQUery.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightGodwoken, lightGodwokenVersion]);

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
        </div>
      </Card>
      <ConfirmModal
        title="Confirm Transaction"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={400}
      >
        <ConfirmInfo>
          <span className="title">Depositing</span>
          <div className="amount">
            <div className="ckb-amount">
              <MainText>{CKBInput}</MainText>
              <div className="ckb-icon">
                <CKBIcon></CKBIcon>
              </div>
              <MainText>CKB</MainText>
            </div>
            {sudtInput && (
              <div className="sudt-amount">
                <MainText>{sudtInput}</MainText>
                {selectedSudt?.tokenURI ? <img src={selectedSudt?.tokenURI} alt="" /> : ""}
                <MainText>{selectedSudt?.symbol}</MainText>
              </div>
            )}
          </div>
        </ConfirmInfo>

        <div className="icon-container">
          <LoadingOutlined />
        </div>

        <div className="tips">Waiting for User Confirmation</div>
      </ConfirmModal>
    </>
  );
}
