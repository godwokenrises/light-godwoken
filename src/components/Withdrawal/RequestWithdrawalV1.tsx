import { PlusOutlined } from "@ant-design/icons";
import { Amount } from "@ckitjs/ckit/dist/helpers";
import { Button, notification, Typography } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { useERC20Balance } from "../../hooks/useERC20Balance";
import { useL2CKBBalance } from "../../hooks/useL2CKBBalance";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { Token, WithdrawalEventEmitter } from "../../light-godwoken/lightGodwokenType";
import { L1MappedErc20 } from "../../types/type";
import CKBInputPanel from "../Input/CKBInputPanel";
import CurrencyInputPanel from "../Input/CurrencyInputPanel";
import { ConfirmModal, PageMain, WithdrawalButton } from "./requestWithdrawalStyle";

const { Text } = Typography;

const RequestWithdrawalV1: React.FC = () => {
  const [CKBInput, setCKBInput] = useState("");
  const [sudtValue, setSudtValue] = useState("");

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCKBValueValidate, setIsCKBValueValidate] = useState(true);
  const [isSudtValueValidate, setIsSudtValueValidate] = useState(true);
  const [selectedSudt, setSelectedSudt] = useState<L1MappedErc20>();
  const [sudtBalance, setSudtBalance] = useState<string>();
  const lightGodwoken = useLightGodwoken();
  const query = useL2CKBBalance();
  const CKBBalance = query.data;
  const erc20BalanceQuery = useERC20Balance();

  const tokenList: L1MappedErc20[] | undefined = lightGodwoken?.getBuiltinErc20List();
  const showModal = () => {
    setIsModalVisible(true);
  };

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
    if (sudtValue && sudtBalance && Amount.from(sudtValue, selectedSudt?.decimals).gt(Amount.from(sudtBalance))) {
      setIsSudtValueValidate(false);
    } else {
      setIsSudtValueValidate(true);
    }
  }, [sudtValue, sudtBalance, selectedSudt?.decimals]);

  const sendWithdrawal = () => {
    const capacity = "0x" + Amount.from(CKBInput, 8).toString(16);
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
    if (sudtValue && sudtBalance && Amount.from(sudtValue, selectedSudt?.decimals).gt(Amount.from(sudtBalance))) {
      return `Insufficient ${selectedSudt?.symbol} Amount`;
    }
    return void 0;
  }, [CKBInput, CKBBalance, sudtValue, sudtBalance, selectedSudt?.decimals, selectedSudt?.symbol]);
  return (
    <>
      <PageMain className="main">
        <CKBInputPanel
          value={CKBInput}
          onUserInput={setCKBInput}
          label="Withdraw"
          isLoading={query.isLoading}
          CKBBalance={CKBBalance}
        ></CKBInputPanel>
        <div className="icon">
          <PlusOutlined />
        </div>
        <CurrencyInputPanel
          value={sudtValue}
          onUserInput={setSudtValue}
          label="sUDT(optional)"
          balancesList={erc20BalanceQuery.data?.balances}
          tokenList={tokenList}
          onSelectedChange={handleSelectedChange}
          dataLoading={erc20BalanceQuery.isLoading}
        ></CurrencyInputPanel>
        <WithdrawalButton>
          <Button
            className="submit-button"
            disabled={!CKBInput || !isCKBValueValidate || !isSudtValueValidate}
            onClick={showModal}
          >
            {inputError || "Request Withdrawal"}
          </Button>
        </WithdrawalButton>
      </PageMain>
      <ConfirmModal title="Confirm Request" visible={isModalVisible} onCancel={handleCancel} footer={null}>
        <div className="text-pair">
          <Text>Block wait</Text>
          <Text>50</Text>
        </div>
        <div className="text-pair">
          <Text>Estimated time</Text>
          <Text>30mins</Text>
        </div>
        <div className="tips">
          Layer 2 assets will be locked in Withdrawal Request, available to withdraw to Layer 1 after maturity. Request
          Withdrawal
        </div>
        <WithdrawalButton>
          <Button className="submit-button" loading={loading} onClick={() => sendWithdrawal()}>
            Request Withdrawal
          </Button>
        </WithdrawalButton>
      </ConfirmModal>
    </>
  );
};
export default RequestWithdrawalV1;
