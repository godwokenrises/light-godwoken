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
import { DepositEventEmitter, SUDT, UniversalToken } from "light-godwoken";
import {
  PageContent,
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
import { ReactComponent as PlusIcon } from "../assets/plus.svg";
import { WalletInfo } from "../components/WalletInfo";
import { getDepositInputError, isDepositCKBInputValidate, isSudtInputValidate } from "../utils/inputValidate";
import { formatToThousands, parseStringToBI } from "../utils/numberFormat";
import { ReactComponent as CKBIcon } from "../assets/ckb.svg";
import { WalletConnect } from "../components/WalletConnect";
import { DepositList } from "../components/Deposit/List";
import {
  DepositRejectedError,
  LightGodwokenError,
  NotEnoughCapacityError,
  NotEnoughSudtError,
  TransactionSignError,
} from "light-godwoken";
import { getFullDisplayAmount } from "../utils/formatTokenAmount";
import { captureException } from "@sentry/react";
import EventEmitter from "events";
import { useQuery } from "react-query";
import { useGodwokenVersion } from "../hooks/useGodwokenVersion";
import { useDepositHistory } from "../hooks/useDepositTxHistory";
import { format } from "date-fns";

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
  const cancelTimeout = lightGodwoken?.getCancelTimeout() || 0;
  const tokenList: SUDT[] | undefined = lightGodwoken?.getBuiltinSUDTList();
  const l1Address = lightGodwoken?.provider.getL1Address();
  const ethAddress = lightGodwoken?.provider.getL2Address();
  const depositAddress = lightGodwoken?.generateDepositAddress();
  const godwokenVersion = useGodwokenVersion();

  const { txHistory: depositHistory, addTxToHistory, updateTxWithStatus } = useDepositHistory();
  const depositHistoryTxHashes = depositHistory.map((history) => history.txHash);

  const [depositListListener, setDepositListListener] = useState(new EventEmitter() as DepositEventEmitter);

  const depositListQuery = useQuery(
    [
      "queryDepositList",
      {
        version: lightGodwoken?.getVersion(),
        l2Address: lightGodwoken?.provider.getL2Address(),
      },
    ],
    () => {
      return lightGodwoken?.getDepositList();
    },
    {
      enabled: !!lightGodwoken,
    },
  );

  // append rpc fetched deposit list to local storage
  const { data: depositList, isLoading: depositListLoading } = depositListQuery;
  depositList?.forEach((deposit) => {
    if (!depositHistoryTxHashes.includes(deposit.rawCell.outPoint?.txHash || "")) {
      addTxToHistory({
        capacity: deposit.capacity.toHexString(),
        amount: deposit.amount.toHexString(),
        token: deposit.sudt,
        txHash: deposit.rawCell.outPoint?.txHash || "",
        status: "pending",
        date: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        cancelTimeout,
      });
    }
  });

  const depositHistoryFilteredByCancelTimeout = depositHistory.filter(
    (history) => history.cancelTimeout === cancelTimeout,
  );

  useMemo(() => {
    const pendingList = depositHistory.filter((history) => history.status === "pending");
    const subscribePayload = pendingList.map(({ txHash }) => ({ txHash }));
    const listener = lightGodwoken?.subscribPendingDepositTransactions(subscribePayload);
    if (listener) {
      listener.on("success", (txHash) => {
        updateTxWithStatus(txHash, "success");
      });
      listener.on("fail", (e) => {
        if (e instanceof DepositRejectedError) {
          updateTxWithStatus(e.metadata, "rejected");
        } else if (e instanceof LightGodwokenError) {
          updateTxWithStatus(e.metadata, "fail");
        }
      });
      listener.on("pending", (txHash) => {
        updateTxWithStatus(txHash, "pending");
      });
      setDepositListListener(listener);
    }

    setCKBInput("");
    setSudtInputValue("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightGodwoken, godwokenVersion, depositHistory]);

  useMemo(() => {
    setCKBInput("");
    setSudtInputValue("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightGodwoken, godwokenVersion, ethAddress]);

  useEffect(() => {
    return function cleanup() {
      depositListListener.removeAllListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightGodwoken, godwokenVersion, depositHistory]);

  const handleError = (e: unknown, selectedSudt?: SUDT) => {
    console.error(e);
    if (e instanceof NotEnoughCapacityError) {
      const expect = formatToThousands(getFullDisplayAmount(BI.from(e.metadata.expected), 8, { maxDecimalPlace: 8 }));
      const actual = formatToThousands(getFullDisplayAmount(BI.from(e.metadata.actual), 8, { maxDecimalPlace: 8 }));
      notification.error({
        message: `You need to get more ckb for deposit, cause there is ${expect} CKB expected but only got ${actual} CKB`,
      });
      return;
    }
    if (e instanceof NotEnoughSudtError) {
      const expect = formatToThousands(
        getFullDisplayAmount(BI.from(e.metadata.expected), selectedSudt?.decimals, {
          maxDecimalPlace: selectedSudt?.decimals,
        }),
      );
      const actual = formatToThousands(
        getFullDisplayAmount(BI.from(e.metadata.actual), selectedSudt?.decimals, {
          maxDecimalPlace: selectedSudt?.decimals,
        }),
      );
      notification.error({
        message: `You need to get more ${selectedSudt?.symbol} for deposit, cause there is ${expect} ${selectedSudt?.symbol} expected but only got ${actual} ${selectedSudt?.symbol}`,
      });
      return;
    }
    if (e instanceof TransactionSignError) {
      notification.error({
        message: `User cancelled sign in metamask, please try again.`,
      });
      return;
    }
    captureException(e);
    notification.error({
      message: `Unknown Error, Please try again later`,
    });
  };
  const deposit = async () => {
    if (!lightGodwoken) {
      throw new Error("LightGodwoken not found");
    }
    const capacity = parseStringToBI(CKBInput, 8).toHexString();
    let amount = "0x0";
    if (selectedSudt && sudtInput) {
      amount = parseStringToBI(sudtInput, selectedSudt.decimals).toHexString();
    }
    setIsModalVisible(true);
    try {
      const txHash = await lightGodwoken.deposit({
        capacity: capacity,
        amount: amount,
        sudtType: selectedSudt?.type,
      });
      addTxToHistory({
        txHash: txHash,
        capacity,
        amount,
        token: selectedSudt,
        status: "pending",
        date: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        cancelTimeout,
      });
      setIsModalVisible(false);
    } catch (e) {
      handleError(e, selectedSudt);
      setIsModalVisible(false);
      return;
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

  const handleSelectedChange = (value: UniversalToken, balance: string) => {
    setSelectedSudt(value as SUDT);
    setSelectedSudtBalance(balance);
  };

  return (
    <PageContent>
      <Card>
        <WalletConnect></WalletConnect>
        <div style={{ opacity: lightGodwoken ? "1" : "0.5" }}>
          <CardHeader className="header">
            <Text className="title">
              <span>Deposit To Layer2</span>
            </Text>
            <Text className="description">
              To deposit, transfer CKB or supported sUDT tokens to your L1 Wallet Address first
            </Text>
          </CardHeader>
          <WalletInfo />
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
          <PrimaryButton disabled={!CKBInput || !isCKBValueValidate || !isSudtValueValidate} onClick={deposit}>
            {inputError || "Deposit"}
          </PrimaryButton>
        </div>
      </Card>
      {lightGodwoken && (
        <Card>
          <DepositList depositList={depositHistoryFilteredByCancelTimeout} isLoading={depositListLoading} />
        </Card>
      )}
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
    </PageContent>
  );
}
