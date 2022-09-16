import { PlusOutlined } from "@ant-design/icons";
import { notification } from "antd";
import { providers } from "ethers";
import React, { useMemo, useState } from "react";
import { useERC20Balance } from "../../hooks/useERC20Balance";
import { useL2CKBBalance } from "../../hooks/useL2CKBBalance";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { LightGodwokenV0, ProxyERC20, UniversalToken, WithdrawalEventEmitter } from "light-godwoken";
import CKBInputPanel from "../Input/CKBInputPanel";
import CurrencyInputPanel from "../Input/CurrencyInputPanel";
import WithdrawalTarget from "./WithdrawalTarget";
import { CKB_L1 } from "./const";
import { PageMain } from "./requestWithdrawalStyle";
import SubmitWithdrawal from "./SubmitWithdrawal";
import { assertsLightGodwokenV0, isInstanceOfLightGodwokenV0 } from "../../utils/typeAssert";
import { getInputError } from "../../utils/inputValidate";
import { parseStringToBI } from "../../utils/numberFormat";
import { handleError } from "./service";
import { getEstimateWaitTime } from "../../utils/dateUtils";
import { getDisplayAmount } from "../../utils/formatTokenAmount";
import { createLightGodwokenV1 } from "../../utils/lightGodwoken";

const RequestWithdrawalV0: React.FC = () => {
  const [CKBInput, setCKBInput] = useState("");
  const [sudtValue, setSudtValue] = useState("");
  const [targetValue, setWithdrawalTarget] = useState(CKB_L1);
  const [loading, setLoading] = useState(false);
  const [selectedSudt, setSelectedSudt] = useState<ProxyERC20>();
  const [sudtBalance, setSudtBalance] = useState<string>();
  const lightGodwoken = useLightGodwoken();
  const l2CKBBalanceQuery = useL2CKBBalance();
  const CKBBalance = l2CKBBalanceQuery.data;
  const erc20BalanceQuery = useERC20Balance();
  const tokenList: ProxyERC20[] | undefined = lightGodwoken?.getBuiltinErc20List();
  const withdrawalWaitBlock = lightGodwoken?.getWithdrawalWaitBlock() || 0;
  const blockProduceTime = lightGodwoken?.getBlockProduceTime() || 0;

  const sendWithdrawal = () => {
    const capacity = parseStringToBI(CKBInput, 8).toHexString();
    let amount = "0x0";
    let sudt_script_hash = "0x0000000000000000000000000000000000000000000000000000000000000000";
    if (selectedSudt && sudtValue) {
      amount = parseStringToBI(sudtValue, selectedSudt.decimals).toHexString();
      sudt_script_hash = selectedSudt.sudt_script_hash;
    }
    if (!lightGodwoken || !isInstanceOfLightGodwokenV0(lightGodwoken)) {
      throw new Error("LightGodwoken instance error");
    }
    const lightGodwokenInstance = lightGodwoken as LightGodwokenV0;
    setLoading(true);
    let e: WithdrawalEventEmitter;
    try {
      if (targetValue === CKB_L1) {
        e = lightGodwokenInstance.withdrawWithEvent({
          capacity: capacity,
          amount: amount,
          sudt_script_hash: sudt_script_hash,
        });
      } else {
        const lightGodwokenV1 = createLightGodwokenV1(
          lightGodwokenInstance.provider.getL2Address(),
          lightGodwokenInstance.provider.getNetwork(),
          (lightGodwokenInstance.provider.ethereum.provider as providers.Web3Provider).provider,
        );
        e = lightGodwokenInstance.withdrawToV1WithEvent({
          capacity: capacity,
          amount: amount,
          sudt_script_hash: sudt_script_hash,
          lightGodwoken: lightGodwokenV1,
        });
      }
    } catch (e) {
      handleError(e, selectedSudt);
      setLoading(false);
      return;
    }

    e.on("sent", (txHash) => {
      notification.success({
        message: `Withdrawal Tx(${txHash}) has been sent,it will take less than 5 minutes before the tx can be tracked and appear in the pending list, please wait...`,
        duration: 0,
      });
      setCKBInput("");
      setSudtValue("");
      setLoading(false);
    });

    e.on("success", (txHash) => {
      notification.success({ message: `Withdrawal Tx(${txHash}) is successful.` });
    });

    e.on("fail", (result: unknown) => {
      setLoading(false);
      handleError(result, selectedSudt);
    });
  };

  const handleSelectedChange = (value: UniversalToken, balance: string) => {
    setSelectedSudt(value as ProxyERC20);
    setSudtBalance(balance);
  };

  const minimalWithdrawCKBAmount = useMemo(() => {
    if (!lightGodwoken) return 0;

    assertsLightGodwokenV0(lightGodwoken);

    if (targetValue === CKB_L1) {
      return Number(getDisplayAmount(lightGodwoken.getMinimalWithdrawalCapacity()));
    }
    return Number(getDisplayAmount(lightGodwoken.getMinimalWithdrawalToV1Capacity()));
  }, [lightGodwoken, targetValue]);

  const inputError = useMemo(() => {
    if (!lightGodwoken) return "waiting";

    assertsLightGodwokenV0(lightGodwoken);

    return getInputError(
      {
        CKBInput,
        CKBBalance,
        sudtValue,
        sudtBalance,
        sudtDecimals: selectedSudt?.decimals,
        sudtSymbol: selectedSudt?.symbol,
      },
      {
        minimumCKBAmount: minimalWithdrawCKBAmount,
      },
    );
  }, [
    lightGodwoken,
    CKBInput,
    CKBBalance,
    sudtValue,
    sudtBalance,
    selectedSudt?.decimals,
    selectedSudt?.symbol,
    minimalWithdrawCKBAmount,
  ]);

  useMemo(() => {
    setCKBInput("");
    setSudtValue("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightGodwoken]);

  return (
    <>
      <PageMain className="main">
        <WithdrawalTarget value={targetValue} onSelectedChange={setWithdrawalTarget}></WithdrawalTarget>
        <CKBInputPanel
          value={CKBInput}
          onUserInput={setCKBInput}
          label="Withdraw"
          isLoading={l2CKBBalanceQuery.isLoading}
          CKBBalance={CKBBalance}
          placeholder={minimalWithdrawCKBAmount ? `Minimum ${minimalWithdrawCKBAmount} CKB` : ""}
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
          blockWait={targetValue === CKB_L1 ? String(withdrawalWaitBlock) : "1"}
          estimatedTime={
            targetValue === CKB_L1 ? getEstimateWaitTime(withdrawalWaitBlock, blockProduceTime) : "a few minutes"
          }
          loading={loading}
          buttonText={inputError}
          CKBInput={CKBInput}
          sudtInput={sudtValue}
          tokenURI={selectedSudt?.tokenURI}
          sudtSymbol={selectedSudt?.symbol}
          disabled={!!inputError}
        ></SubmitWithdrawal>
      </PageMain>
    </>
  );
};
export default RequestWithdrawalV0;
