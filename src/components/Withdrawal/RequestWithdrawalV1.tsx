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
import { BaseL1TxHistoryInterface } from "../../hooks/useL1TxHistory";
import { getInputError, isCKBInputValidate, isSudtInputValidate } from "../../utils/inputValidate";
import { parseStringToBI } from "../../utils/numberFormat";
import { handleError } from "./service";
import { LightGodwokenV1 } from "../../light-godwoken";
import { getEstimateWaitTime } from "../../utils/dateUtils";

const RequestWithdrawalV1: React.FC<{ addTxToHistory: (txHistory: BaseL1TxHistoryInterface) => void }> = ({
  addTxToHistory,
}) => {
  const [CKBInput, setCKBInput] = useState("");
  const [sudtValue, setSudtValue] = useState("");

  const [loading, setLoading] = useState(false);
  const [isCKBValueValidate, setIsCKBValueValidate] = useState(true);
  const [isSudtValueValidate, setIsSudtValueValidate] = useState(true);
  const [selectedSudt, setSelectedSudt] = useState<L1MappedErc20>();
  const [sudtBalance, setSudtBalance] = useState<string>();
  const lightGodwoken = useLightGodwoken();
  const l2CKBBalanceQuery = useL2CKBBalance();
  const CKBBalance = l2CKBBalanceQuery.data;
  const erc20BalanceQuery = useERC20Balance();
  const withdrawalWaitBlock = lightGodwoken?.getWithdrawalWaitBlock() || 0;
  const blockProduceTime = lightGodwoken?.getBlockProduceTime() || 0;

  const tokenList: L1MappedErc20[] | undefined = lightGodwoken?.getBuiltinErc20List();
  useEffect(() => {
    if (!CKBBalance) {
      setIsCKBValueValidate(false);
    } else {
      setIsCKBValueValidate(isCKBInputValidate(CKBInput, CKBBalance, { decimals: 18, minimumCKBAmount: 400 }));
    }
  }, [CKBBalance, CKBInput]);

  useEffect(() => {
    setIsSudtValueValidate(isSudtInputValidate(sudtValue, sudtBalance, selectedSudt?.decimals));
  }, [sudtValue, sudtBalance, selectedSudt?.decimals]);

  const sendWithdrawal = async () => {
    const capacity = parseStringToBI(CKBInput, 8).toHexString();
    let amount = "0x0";
    let sudt_script_hash = "0x0000000000000000000000000000000000000000000000000000000000000000";
    if (selectedSudt && sudtValue) {
      amount = parseStringToBI(sudtValue, selectedSudt.decimals).toHexString();
      sudt_script_hash = selectedSudt.sudt_script_hash;
    }
    if (!lightGodwoken || !isInstanceOfLightGodwokenV1(lightGodwoken)) {
      throw new Error("LightGodwoken instance error");
    }

    setLoading(true);
    let eventEmitter: WithdrawalEventEmitter;
    try {
      eventEmitter = await (lightGodwoken as LightGodwokenV1).withdrawWithEvent({
        capacity: capacity,
        amount: amount,
        sudt_script_hash: sudt_script_hash,
      });
    } catch (e) {
      handleError(e, selectedSudt);
      setLoading(false);
      return;
    }

    eventEmitter.on("sent", (txHash) => {
      notification.success({ message: `Withdrawal Tx(${txHash}) has been sent, waiting for it to be committed.` });
      setCKBInput("");
      setSudtValue("");
      setLoading(false);
      // commented here, will reopen after godwoken 1.2 goes live
      // addTxToHistory({
      //   type: "withdrawal",
      //   txHash,
      //   capacity,
      //   amount,
      //   token: selectedSudt,
      //   status: "l2Pending",
      // });
    });

    eventEmitter.on("fail", (result: unknown) => {
      console.log("fail triggerd:", result);
      setLoading(false);
      handleError(result, selectedSudt);
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

  useMemo(() => {
    setCKBInput("");
    setSudtValue("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightGodwoken]);

  return (
    <>
      <PageMain className="main">
        <CKBInputPanel
          value={CKBInput}
          onUserInput={setCKBInput}
          label="Withdraw"
          isLoading={l2CKBBalanceQuery.isLoading}
          CKBBalance={CKBBalance}
          decimals={lightGodwoken?.getNativeAsset().decimals || 18}
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
          blockWait={String(withdrawalWaitBlock)}
          estimatedTime={getEstimateWaitTime(withdrawalWaitBlock, blockProduceTime)}
          loading={loading}
          buttonText={inputError}
          CKBInput={CKBInput}
          sudtInput={sudtValue}
          tokenURI={selectedSudt?.tokenURI}
          sudtSymbol={selectedSudt?.symbol}
          disabled={!CKBInput || !isCKBValueValidate || !isSudtValueValidate}
        ></SubmitWithdrawal>
      </PageMain>
    </>
  );
};
export default RequestWithdrawalV1;
