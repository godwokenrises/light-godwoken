import styled from "styled-components";
import CkbSvg, { ReactComponent as CKBIcon } from "../../assets/ckb.svg";
import { BI } from "@ckb-lumos/lumos";
import { HashType } from "@ckb-lumos/base";
import { notification, Tooltip } from "antd";
import {
  L1TransactionRejectedError,
  NotEnoughCapacityError,
  NotEnoughSudtError,
  SUDT,
  TransactionSignError,
  UniversalToken,
} from "light-godwoken";
import React, { useEffect, useMemo, useState } from "react";
import { getL1TransferInputError } from "../../utils/inputValidate";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { useL1CKBBalance } from "../../hooks/useL1CKBBalance";
import { useSUDTBalance } from "../../hooks/useSUDTBalance";
import { ConfirmModal, InputInfo, LoadingWrapper, MainText, PrimaryButton, Tips } from "../../style/common";
import { ArrowDownwardFilled } from "@ricons/material";
import { Icon } from "@ricons/utils";
import { formatToThousands, parseStringToBI } from "../../utils/numberFormat";
import { LoadingOutlined } from "@ant-design/icons";
import { getFullDisplayAmount } from "../../utils/formatTokenAmount";
import { truncateCkbAddress, truncateDotBitAlias, truncateEthAddress } from "../../utils/stringFormat";
import { captureException } from "@sentry/react";
import { useL1TxHistory } from "../../hooks/useL1TxHistory";
import { useGodwokenVersion } from "../../hooks/useGodwokenVersion";
import CurrencyInputPanel from "../Input/CurrencyInputPanel";
import DotBitL1Input from "../DotBit/DotBitL1Input";
import { DotBitL1AddressData } from "../DotBit/DotBitL1AddressOption";
import { DotBitCoinType } from "../../hooks/useDotBit";
import { COLOR } from "../../style/variables";

const CkbAsSudt: SUDT = {
  name: "CKB",
  symbol: "CKB",
  uan: "CKB.ckb",
  decimals: 8,
  tokenURI: CkbSvg,
  type: {
    hashType: "0x" as HashType,
    codeHash: "0x",
    args: "0x",
  },
};

const RequestL1TransferStyleWrapper = styled.div`
  .icon-container {
    padding: 7px 0;
    display: flex;
    justify-content: center;
    font-size: 16px;
  }
`;
const ModalContent = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const DotBitAliasCard = styled.div`
  padding: 6px 10px;
  width: 100%;
  border-radius: 6px;
  border: 1px solid #c3d6c3;
  background-color: #e8f6e8;

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .title {
    font-weight: 600;
    color: ${COLOR.secondary};
  }
  .value {
    display: inline-flex;
    align-items: center;
  }
  .avatar {
    margin-right: 4px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #f2f2f2;
    border: 1px solid #c3d6c3;
  }
`;

export default function RequestL1Transfer() {
  const lightGodwoken = useLightGodwoken();
  const godwokenVersion = useGodwokenVersion();
  const l1Address = lightGodwoken?.provider.getL1Address();

  // tx history
  const storeKey = lightGodwoken ? `${godwokenVersion}/${l1Address}/transfer` : null;
  const { addTxToHistory } = useL1TxHistory(storeKey);

  // selected currency
  const [amount, setAmount] = useState("");
  const [selected, setSelected] = useState<SUDT>(CkbAsSudt);
  const [selectedBalance, setSelectedBalance] = useState<string>();
  const isSelectedCkb = useMemo(() => selected?.uan === CkbAsSudt.uan, [selected]);
  function onSelectedChanged(value: UniversalToken, balance: string) {
    setSelected(value as SUDT);
    setSelectedBalance(balance);
  }

  // recipient address
  const [recipient, setRecipient] = useState("");
  useEffect(() => {
    setAmount("");
    setSelected(CkbAsSudt);
    setRecipient("");
  }, [lightGodwoken, godwokenVersion, addTxToHistory]);

  // ckb balance
  const ckbBalanceQuery = useL1CKBBalance();
  useEffect(() => {
    if (isSelectedCkb && ckbBalanceQuery.data) {
      setSelectedBalance(ckbBalanceQuery.data);
    }
  }, [isSelectedCkb, ckbBalanceQuery.data]);

  // currency list
  const tokenList = useMemo(() => [CkbAsSudt, ...(lightGodwoken?.getBuiltinSUDTList() ?? [])], [lightGodwoken]);

  // sudt balances (combined with ckb balance)
  const sudtBalanceQuery = useSUDTBalance();

  // currency balances
  const currencyBalanceLoading = useMemo(
    () => ckbBalanceQuery.isLoading || sudtBalanceQuery.isLoading,
    [ckbBalanceQuery.isLoading, sudtBalanceQuery.isLoading],
  );
  const currencyBalanceList = useMemo(() => {
    if (currencyBalanceLoading) return void 0;
    return [ckbBalanceQuery.data ?? "0x0", ...(sudtBalanceQuery.data?.balances ?? [])];
  }, [currencyBalanceLoading, ckbBalanceQuery.data, sudtBalanceQuery.data]);

  // dotbit account
  const isValidDotBitAlias = useMemo(() => (recipient ? /.+\.bit$/.test(recipient) : false), [recipient]);
  const [selectedAliasAddress, setSelectedAliasAddress] = useState<DotBitL1AddressData | undefined>();

  // recipient final address
  const recipientAddress = useMemo(() => {
    return isValidDotBitAlias ? selectedAliasAddress?.value ?? "" : recipient;
  }, [isValidDotBitAlias, selectedAliasAddress, recipient]);

  // input error message
  const inputError = useMemo(() => {
    if (!lightGodwoken) {
      return "Wallet Not Connected";
    }
    return getL1TransferInputError({
      ckbValue: isSelectedCkb ? amount : "",
      ckbBalance: ckbBalanceQuery.data,
      sudtValue: !isSelectedCkb ? amount : "",
      sudtBalance: !isSelectedCkb ? selectedBalance : void 0,
      sudtSymbol: !isSelectedCkb ? selected.symbol : void 0,
      sudtDecimals: !isSelectedCkb ? selected.decimals : void 0,
      isSelectedAliasAddress: isValidDotBitAlias,
      recipientAddress: recipientAddress,
      senderAddress: lightGodwoken.provider.l1Address,
      config: lightGodwoken!.getConfig(),
    });
  }, [
    amount,
    ckbBalanceQuery.data,
    isSelectedCkb,
    isValidDotBitAlias,
    lightGodwoken,
    recipientAddress,
    selected.decimals,
    selected.symbol,
    selectedBalance,
  ]);

  // confirmation dialog
  const [modalVisible, setModalVisible] = useState(false);
  useEffect(() => setModalVisible(false), [lightGodwoken]);

  async function l1Transfer() {
    if (!lightGodwoken) {
      throw new Error("LightGodwoken not found");
    }

    setModalVisible(true);
    try {
      const isSelectedSudt = !isSelectedCkb && selected;
      const decimals = isSelectedSudt ? selected.decimals : 8;
      const parsedAmount = parseStringToBI(amount, decimals);
      const txHash = await lightGodwoken.l1Transfer({
        amount: parsedAmount.toHexString(),
        sudtType: isSelectedSudt ? selected.type : void 0,
        toAddress: recipientAddress.trim(),
      });

      addTxToHistory({
        txHash,
        type: "transfer",
        status: "pending",
        recipient: recipientAddress.trim(),
        capacity: isSelectedCkb ? parsedAmount.toString() : "0",
        amount: isSelectedSudt ? parsedAmount.toString() : "0",
        token: isSelectedSudt ? selected : void 0,
        symbol: isSelectedSudt ? selected.symbol : void 0,
        decimals: isSelectedSudt ? selected.decimals : void 0,
      });
    } catch (e) {
      handleError(e, selected);
    } finally {
      setModalVisible(false);
    }
  }

  function handleError(e: unknown, selectedSudt?: SUDT) {
    console.error(e);
    if (e instanceof NotEnoughCapacityError) {
      const expect = formatToThousands(getFullDisplayAmount(BI.from(e.metadata.expected), 8, { maxDecimalPlace: 8 }));
      const actual = formatToThousands(getFullDisplayAmount(BI.from(e.metadata.actual), 8, { maxDecimalPlace: 8 }));
      notification.error({
        message: `Expected ${expect} CKB but only got ${actual} CKB`,
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
        message: `Expected ${expect} ${selectedSudt?.symbol} but only got ${actual} ${selectedSudt?.symbol}`,
      });
      return;
    }
    if (e instanceof TransactionSignError) {
      notification.error({
        message: `User denied message signature`,
      });
      return;
    }
    if (e instanceof L1TransactionRejectedError) {
      const txHash = e.metadata;
      const explorerUrl = lightGodwoken?.getConfig().layer1Config.SCANNER_URL;
      notification.error({
        message: `Tx(${txHash}) rejected, click to view details in the explorer`,
        onClick: () => window.open(`${explorerUrl}/transaction/${txHash}`, "_blank"),
      });
    }

    captureException(e);
    notification.error({
      message: `Unknown Error, Please try again later`,
    });
  }

  return (
    <RequestL1TransferStyleWrapper>
      <CurrencyInputPanel
        label="Transfer"
        value={amount}
        onUserInput={setAmount}
        tokenList={tokenList}
        selected={selected}
        onSelectedChange={onSelectedChanged}
        balancesList={currencyBalanceList}
        dataLoading={sudtBalanceQuery.isLoading}
        disableMaxButton={isSelectedCkb}
      />
      <div className="icon-container">
        <Icon>
          <ArrowDownwardFilled />
        </Icon>
      </div>
      <DotBitL1Input
        label="Recipient"
        placeholder="CKB Address Or .Bit Account"
        value={recipient}
        onUserInput={setRecipient}
        selected={selectedAliasAddress}
        onSelected={(address) => setSelectedAliasAddress(address)}
      />
      <PrimaryButton disabled={!amount || inputError !== void 0} onClick={l1Transfer}>
        {inputError || "Transfer"}
      </PrimaryButton>
      <ConfirmModal
        title="Confirm Transaction"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={400}
      >
        <ModalContent>
          <InputInfo>
            <span className="title">Transferring</span>
            <div className="amount">
              {isSelectedCkb && (
                <div className="ckb-amount">
                  <MainText>{formatToThousands(amount)}</MainText>
                  <div className="ckb-icon">
                    <CKBIcon></CKBIcon>
                  </div>
                  <MainText>CKB</MainText>
                </div>
              )}
              {!isSelectedCkb && selected && (
                <div className="sudt-amount">
                  <MainText>{formatToThousands(amount)}</MainText>
                  {selected.tokenURI && <img src={selected.tokenURI} alt="" />}
                  <MainText>{selected.symbol}</MainText>
                </div>
              )}
            </div>
          </InputInfo>
          <InputInfo>
            <span className="title">Recipient</span>
            <Tooltip title={recipientAddress} placement="topRight">
              <div className="address">{truncateCkbAddress(recipientAddress)}</div>
            </Tooltip>
          </InputInfo>
          {isValidDotBitAlias && selectedAliasAddress && (
            <DotBitAliasCard>
              <div className="row">
                <div className="title">Recipient alias to</div>
                <Tooltip title={recipient} placement="topRight">
                  <MainText className="value">
                    <img src={`https://display.did.id/identicon/${recipient}`} alt="avatar" className="avatar" />
                    <span>{truncateDotBitAlias(recipient)}</span>
                  </MainText>
                </Tooltip>
              </div>
              {selectedAliasAddress.coinType === DotBitCoinType.Eth && (
                <div className="row">
                  <div className="title">Ethereum address</div>
                  <Tooltip title={selectedAliasAddress.address} placement="topRight">
                    <MainText className="value">{truncateEthAddress(selectedAliasAddress.address)}</MainText>
                  </Tooltip>
                </div>
              )}
            </DotBitAliasCard>
          )}
          <LoadingWrapper>
            <LoadingOutlined />
          </LoadingWrapper>
          <Tips>Waiting for User Confirmation</Tips>
        </ModalContent>
      </ConfirmModal>
    </RequestL1TransferStyleWrapper>
  );
}
