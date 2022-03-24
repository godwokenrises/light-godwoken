import { ArrowLeftOutlined, PlusOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Amount } from "@ckitjs/ckit/dist/helpers";
import { Button, Modal, notification, Typography } from "antd";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import { useCKBBalance } from "../hooks/useCKBBalance";
import { useLightGodwoken } from "../hooks/useLightGodwoken";
import { WithdrawalEventEmitter } from "../light-godwoken/lightGodwokenType";
import { L1MappedErc20 } from "../types/type";
import CKBInputPanel from "./CKBInputPanel";
import CurrencyInputPanel from "./CurrencyInputPanel";
import Page from "./Page";

const { Text } = Typography;

const PageContent = styled.div`
  width: 436px;
  background: rgb(39, 37, 52);
  border-radius: 24px;
  color: white;
`;
const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 24px;
  align-items: center;
  a,
  .ant-typography {
    color: white;
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
  }
  .ant-modal-close-x {
    color: white;
  }
  .ant-typography {
    color: white;
    justify-content: space-between;
  }
  .text-pair {
    padding-top: 5px;
    display: flex;
    justify-content: space-between;
    font-size: 24px;
  }
  .tips {
    margin: 24px 0;
  }
`;

interface Token {
  name: string;
  symbol: string;
  decimals: number;
  tokenURI: string;
}

export default function RequestWithdrawal() {
  const [ckbInput, setCkbInput] = useState("");
  const [sudtValue, setSudtValue] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitButtonDisable, setSubmitButtonDisable] = useState(true);
  const [selectedSudt, setSelectedSudt] = useState<L1MappedErc20>();
  const [sudtBalance, setSudtBalance] = useState<string>();
  const lightGodwoken = useLightGodwoken();
  const query = useCKBBalance(false);
  const params = useParams();
  const showModal = () => {
    setIsModalVisible(true);
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

  const sendWithDrawal = () => {
    const validateInput = (ckb: string, sudt: string) => {
      if (!query.data) {
        throw new Error("No CKB balance Data");
      }
      if (sudtBalance === undefined) {
        throw new Error("No sudt balance Data");
      }
      console.log(Amount.from(ckb), Amount.from(query.data), Amount.from(ckb).lt(Amount.from(query.data)));
      if (Amount.from(ckb).gt(Amount.from(query.data))) {
        notification.error({ message: "You Don't have enough CKB, Please check your CKB balance and type again" });
        return false;
      }
      if (Amount.from(sudt, selectedSudt?.decimals).gt(Amount.from(sudtBalance, selectedSudt?.decimals))) {
        notification.error({
          message: `You Don't have enough ${selectedSudt?.symbol}, Please check your balance and type again`,
        });
        return false;
      }
      return true;
    };
    const capacity = "0x" + Amount.from(ckbInput, 8).toString(16);
    let amount = "0x0";
    let sudt_script_hash = "0x0000000000000000000000000000000000000000000000000000000000000000";
    if (selectedSudt && sudtValue) {
      amount = "0x" + Amount.from(sudtValue, selectedSudt.decimals).toString(16);
      sudt_script_hash = selectedSudt.sudt_script_hash;
    }
    if (!lightGodwoken) {
      setIsModalVisible(false);
      return;
    }
    if (!validateInput(capacity, amount)) {
      setIsModalVisible(false);
      return;
    }
    setLoading(true);
    let e: WithdrawalEventEmitter;
    try {
      e = lightGodwoken.withdrawWithEvent({
        capacity: capacity,
        amount: amount,
        sudt_script_hash: sudt_script_hash,
      });
    } catch (e) {
      setIsModalVisible(false);
      if (e instanceof Error) {
        notification.error({
          message: e.message,
        });
      }
      setLoading(false);
      return;
    }

    e.on("sent", (txHash) => {
      setIsModalVisible(false);
      notification.info({ message: `Withdrawal Tx(${txHash}) has sent, waiting for it is committed` });
      setLoading(false);
    });

    e.on("pending", (result) => {
      console.log("pending triggerd", result);
    });

    e.on("success", (txHash) => {
      setIsModalVisible(false);
      notification.success({ message: `Withdrawal Tx(${txHash}) is successful` });
    });

    e.on("error", (result: unknown) => {
      setLoading(false);
      setIsModalVisible(false);
      notification.error({ message: result instanceof Error ? result.message : JSON.stringify(result) });
    });

    e.on("fail", (result: unknown) => {
      setLoading(false);
      setIsModalVisible(false);
      notification.error({ message: result instanceof Error ? result.message : JSON.stringify(result) });
    });
  };
  const handleSelectedChange = (value: Token, balance: string) => {
    setSelectedSudt(value as L1MappedErc20);
    setSudtBalance(balance);
  };

  return (
    <Page>
      <PageContent>
        <PageHeader className="header">
          <Link to={"/" + params.version}>
            <ArrowLeftOutlined />
          </Link>
          <Text>Request Withdrawal</Text>
          <QuestionCircleOutlined />
        </PageHeader>
        <PageMain className="main">
          <CKBInputPanel value={ckbInput} onUserInput={setCkbInput} label="Withdraw"></CKBInputPanel>
          <div className="icon">
            <PlusOutlined />
          </div>
          <CurrencyInputPanel
            value={sudtValue}
            onUserInput={setSudtValue}
            label="sUDT(optional)"
            onSelectedChange={handleSelectedChange}
          ></CurrencyInputPanel>
          <WithDrawalButton>
            <Button className="submit-button" disabled={submitButtonDisable} onClick={showModal}>
              Request Withdrawal
            </Button>
          </WithDrawalButton>
        </PageMain>
        <div className="footer">
          {/* <ProgressStepper currentStep={0} steps={withdrawalSteps}></ProgressStepper> */}
        </div>
      </PageContent>
      <ConfirmModal title="Confirm Request" visible={isModalVisible} onCancel={handleCancel} footer={null}>
        <div className="text-pair">
          <Text>Block wait</Text>
          <Text>{params.version === "v0" ? "10000" : "50"}</Text>
        </div>
        <div className="text-pair">
          <Text>Estimated time</Text>
          <Text>{params.version === "v0" ? "5 days" : "30mins"}</Text>
        </div>
        <div className="tips">
          Layer 2 assets will be locked in Withdrawal Request, available to withdraw to Layer 1 after maturity. Request
          Withdrawal
        </div>
        <WithDrawalButton>
          <Button className="submit-button" loading={loading} onClick={() => sendWithDrawal()}>
            Request Withdrawal
          </Button>
        </WithDrawalButton>
      </ConfirmModal>
    </Page>
  );
}
