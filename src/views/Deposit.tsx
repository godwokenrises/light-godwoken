import { CopyOutlined, LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { BI } from "@ckb-lumos/lumos";
import { Button, message, Modal, notification, Typography } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useLightGodwoken, useLightGodwokenVersion } from "../hooks/useLightGodwoken";
import CKBInputPanel from "../components/Input/CKBInputPanel";
import CurrencyInputPanel from "../components/Input/CurrencyInputPanel";
import { getDisplayAmount } from "../utils/formatTokenAmount";
import { useSUDTBalance } from "../hooks/useSUDTBalance";
import { useL1CKBBalance } from "../hooks/useL1CKBBalance";
import { useL2CKBBalance } from "../hooks/useL2CKBBalance";
import { SUDT, Token } from "../light-godwoken/lightGodwokenType";
import { TransactionHistory } from "../components/TransactionHistory";
import { useL1TxHistory } from "../hooks/useL1TxHistory";
import { useChainId } from "../hooks/useChainId";
import { getDepositInputError, isDepositCKBInputValidate, isSudtInputValidate } from "../utils/inputValidate";
import { parseStringToBI } from "../utils/numberFormat";
import { ClaimSudt } from "../components/ClaimSudt";
import { UseQueryResult } from "react-query/types/react";

const { Text } = Typography;

const PageContent = styled.div`
  width: 436px;
  background: rgb(39, 37, 52);
  border-radius: 24px;
  color: white;
`;
const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
  a,
  .ant-typography {
    color: white;
  }
  .title {
    padding-bottom: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    > span {
      font-weight: bold;
      font-size: 20px;
    }
  }
  .description {
    font-size: 14px;
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
  .claim {
    a {
      color: rgb(255, 67, 66);
      text-decoration: none;
    }
  }
`;
const L1WalletAddress = styled.div`
  display: flex;
  flex-direction: column;
  margin: 24px;
  padding: 16px;
  border: 1px solid rgb(60, 58, 75);
  border-radius: 16px;
  .ant-typography {
    color: white;
  }
  .title {
    font-size: 16px;
    padding-bottom: 10px;
  }
  .address {
    font-size: 16px;
    padding-bottom: 10px;
  }
  .copy {
    color: rgb(255, 67, 66);
    .ant-typography {
      font-size: 14px;
      color: rgb(255, 67, 66);
      padding-right: 5px;
    }
    &:hover {
      cursor: pointer;
    }
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
    color: white;
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
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .ant-modal-close-x {
    color: white;
  }
  .ant-typography {
    color: white;
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

function L2Balance({ decimals, query }: { decimals: number | undefined; query: UseQueryResult<string, unknown> }) {
  const loading = !query.data || query.isLoading;
  return (
    <span>L2 Balance: {loading ? <LoadingOutlined /> : getDisplayAmount(BI.from(query.data), decimals || 8)} CKB</span>
  );
}

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

  const copyAddress = () => {
    navigator.clipboard.writeText(lightGodwoken?.provider.getL1Address() || "");
    message.success("copied L1 address to clipboard");
  };
  return (
    <>
      <PageContent>
        <PageHeader className="header">
          <Text className="title">
            <span>Deposit To Layer2</span>
            {/* <TransactionHistory type="deposit"></TransactionHistory> */}
          </Text>
          <Text className="description">
            To deposit, transfer CKB or supported sUDT tokens to your L1 Wallet Address first
          </Text>
        </PageHeader>
        <L1WalletAddress>
          <Text className="title">L1 Wallet Address</Text>
          <Text className="address">{lightGodwoken?.provider.getL1Address()}</Text>
          <div className="copy" onClick={copyAddress}>
            <Text>Copy Address</Text>
            <CopyOutlined />
          </div>
        </L1WalletAddress>
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
            <PlusOutlined />
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
          <div>
            <L2Balance query={l2CKBBalanceQuery} decimals={lightGodwoken?.getNativeAsset().decimals} />
          </div>
          <div className="claim">
            <div>
              <ClaimSudt />
            </div>
            <div>
              <a href="https://faucet.nervos.org/" target="_blank" rel="noreferrer">
                CKB Testnet Faucet
              </a>
            </div>
          </div>
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
