import { PlusOutlined } from "@ant-design/icons";
import { notification } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { useERC20Balance } from "../../hooks/useERC20Balance";
import { useL2CKBBalance } from "../../hooks/useL2CKBBalance";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { Token, WithdrawalEventEmitter } from "../../light-godwoken/lightGodwokenType";
import { L1MappedErc20 } from "../../types/type";
import { isInstanceOfLightGodwokenV1 } from "../../utils/typeAssert";
import CKBInputPanel from "../Input/CKBInputPanel";
import CurrencyInputPanel from "../Input/CurrencyInputPanel";
import { PageMain } from "./requestWithdrawalStyle";
import SubmitWithdrawal from "./SubmitWithdrawal";
import { useL1TxHistory } from "../../hooks/useL1TxHistory";
import { useChainId } from "../../hooks/useChainId";
import { getInputError, isCKBInputValidate, isSudtInputValidate } from "../../utils/inputValidate";
import { parseUnit } from "../../utils/numberFormat";

const RequestWithdrawalV1: React.FC = () => {
  const [CKBInput, setCKBInput] = useState("");
  const [sudtValue, setSudtValue] = useState("");

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
  const l1Address = lightGodwoken?.provider.getL1Address();
  const { data: chainId } = useChainId();
  const { addTxToHistory } = useL1TxHistory(`${chainId}/${l1Address}/withdrawal`);
  useEffect(() => {
    setIsCKBValueValidate(isCKBInputValidate(CKBInput, CKBBalance));
  }, [CKBBalance, CKBInput]);

  useEffect(() => {
    setIsSudtValueValidate(isSudtInputValidate(sudtValue, sudtBalance, selectedSudt?.decimals));
  }, [sudtValue, sudtBalance, selectedSudt?.decimals]);

  const sendWithdrawal = () => {
    const capacity = "0x" + parseUnit(CKBInput, 8).toString(16);
    let amount = "0x0";
    let sudt_script_hash = "0x0000000000000000000000000000000000000000000000000000000000000000";
    if (selectedSudt && sudtValue) {
      amount = "0x" + parseUnit(sudtValue, selectedSudt.decimals).toString(16);
      sudt_script_hash = selectedSudt.sudt_script_hash;
    }
    if (!lightGodwoken || !isInstanceOfLightGodwokenV1(lightGodwoken)) {
      throw new Error("LightGodwoken instance error");
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
      if (e instanceof Error) {
        notification.error({
          message: e.message,
        });
      }
      setLoading(false);
      return;
    }

    e.on("sent", (txHash) => {
      notification.info({ message: `Withdrawal Tx(${txHash}) has sent, waiting for it is committed` });
      setLoading(false);
      addTxToHistory({
        type: "withdrawal",
        txHash,
        capacity,
        amount,
        symbol: selectedSudt?.symbol,
        decimals: selectedSudt?.decimals,
      });
    });

    e.on("pending", (result) => {
      console.log("pending triggerd", result);
    });

    e.on("success", (txHash) => {
      notification.success({ message: `Withdrawal Tx(${txHash}) is successful` });
    });

    e.on("error", (result: unknown) => {
      setLoading(false);
      notification.error({ message: result instanceof Error ? result.message : JSON.stringify(result) });
    });

    e.on("fail", (result: unknown) => {
      setLoading(false);
      notification.error({ message: result instanceof Error ? result.message : JSON.stringify(result) });
    });
  };
  const handleSelectedChange = (value: Token, balance: string) => {
    setSelectedSudt(value as L1MappedErc20);
    setSudtBalance(balance);
  };

  const inputError = useMemo(() => {
    return getInputError({
      CKBInput,
      CKBBalance,
      sudtValue,
      sudtBalance,
      sudtDecimals: selectedSudt?.decimals,
      sudtSymbol: selectedSudt?.symbol,
    });
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
        <SubmitWithdrawal
          sendWithdrawal={sendWithdrawal}
          blockWait="50"
          estimatedTime="30 mins"
          loading={loading}
          buttonText={inputError}
          disabled={!CKBInput || !isCKBValueValidate || !isSudtValueValidate}
        ></SubmitWithdrawal>
      </PageMain>
    </>
  );
};
export default RequestWithdrawalV1;
