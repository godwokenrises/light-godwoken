import { CopyOutlined, LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { Script } from "@ckb-lumos/lumos";
import { Button, Modal, notification, Typography } from "antd";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useLightGodwoken } from "../hooks/useLightGodwoken";
import CKBInputPanel from "./CKBInputPanel";
import CurrencyInputPanel from "./CurrencyInputPanel";
import Page from "./Page";
import { useQuery } from "react-query";
import { getDisplayAmount } from "../utils/formatTokenAmount";

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
    font-weight: bold;
    font-size: 20px;
    padding-bottom: 5px;
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
  .l1-faucet {
    display: flex;
    flex-direction: column;
    padding-top: 20px;
    .ant-typography {
      color: white;
      padding-right: 5px;
    }
    a {
      color: rgb(255, 67, 66);
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
const WithDrawalButton = styled.div`
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

interface Token {
  name: string;
  symbol: string;
  decimals: number;
  tokenURI: string;
}

interface SUDT extends Token {
  type: Script;
}
function L2Balance() {
  const lightGodwoken = useLightGodwoken();

  const l2Address = lightGodwoken?.provider.l2Address;
  const { data: balance } = useQuery(
    ["queryL2Balance", { address: l2Address }],
    () => {
      return lightGodwoken?.getL2CkbBalance();
    },
    {
      enabled: !!lightGodwoken,
    },
  );

  if (!l2Address) return null;
  if (!balance) {
    return (
      <span>
        <LoadingOutlined />
      </span>
    );
  }
  return <span>L2 Balance: {getDisplayAmount(BigInt(balance), 8)} CKB</span>;
}

export default function Deposit() {
  const [ckbInput, setCkbInput] = useState("");
  const [outputValue, setOutputValue] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitButtonDisable, setSubmitButtonDisable] = useState(true);
  const [selectedSudt, setSelectedSudt] = useState<SUDT>();
  const lightGodwoken = useLightGodwoken();

  const showModal = async () => {
    setIsModalVisible(true);
    if (lightGodwoken) {
      const capacity = BigInt(Number(ckbInput) * Math.pow(10, 8));
      let amount = "0x0";
      if (selectedSudt) {
        amount = "0x" + BigInt(Number(outputValue) * Math.pow(10, selectedSudt.decimals)).toString(16);
      }
      try {
        const hash = await lightGodwoken.deposit({
          capacity: "0x" + capacity.toString(16),
          amount: amount,
          sudtType: selectedSudt?.type,
        });
        notification.success({ message: `deposit Tx(${hash}) is successful` });
      } catch (e) {
        notification.error({ message: `must Retain at least 64 CKB!` });
      }

      setIsModalVisible(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  useEffect(() => {
    if (Number(ckbInput) >= 400) {
      setSubmitButtonDisable(false);
    } else {
      setSubmitButtonDisable(true);
    }
  }, [ckbInput]);

  const handleSelectedChange = (value: Token) => {
    setSelectedSudt(value as SUDT);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(lightGodwoken?.provider.getL1Address() || "");
  };
  return (
    <Page>
      <PageContent>
        <PageHeader className="header">
          <Text className="title">Deposit To Layer2</Text>
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
          <CKBInputPanel value={ckbInput} onUserInput={setCkbInput} label="Deposit" isL1></CKBInputPanel>
          <div className="icon">
            <PlusOutlined />
          </div>
          <CurrencyInputPanel
            value={outputValue}
            onUserInput={setOutputValue}
            label="sUDT(optional)"
            onSelectedChange={handleSelectedChange}
            isL1
          ></CurrencyInputPanel>
          <WithDrawalButton>
            <Button className="submit-button" disabled={submitButtonDisable} onClick={showModal}>
              Deposit
            </Button>
          </WithDrawalButton>
          <div>
            <L2Balance />
          </div>
          <div className="l1-faucet">
            <Text>Need Layer 1 test tokens?</Text>
            <a href="https://faucet.nervos.org/" target="_blank" rel="noreferrer">
              CKB Testnet Faucet
            </a>
          </div>
        </PageMain>
        <div className="footer"></div>
      </PageContent>
      <ConfirmModal title="Confirm Transaction" visible={isModalVisible} onCancel={handleCancel} footer={null}>
        <div className="icon-container">
          <LoadingOutlined />
        </div>
        <Text>Waiting For Confirmation</Text>
        <Text>
          Depositing {outputValue} {selectedSudt?.symbol} and {ckbInput} CKB
        </Text>
        <div className="tips">Confirm this transaction in your wallet</div>
      </ConfirmModal>
    </Page>
  );
}
