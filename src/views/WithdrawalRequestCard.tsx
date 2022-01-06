/* eslint-disable */
import React, { useState, useCallback, useEffect, useMemo } from "react";
import styled from "styled-components";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Typography, notification, Modal } from "antd";
import getTimePeriods from "../utils/getTimePeriods";
import { getDisplayAmount, getFullDisplayAmount } from "../utils/formatTokenAmount";
import { Cell, HexNumber } from "@ckb-lumos/lumos";
import { ProxyERC20 } from "../light-godwoken/lightGodwokenType";
import { useLightGodwoken } from "../hooks/useLightGodwoken";
import { Link } from "react-router-dom";
const { Text } = Typography;
const StyleWrapper = styled.div`
  background: rgb(39, 37, 52);
  padding: 16px;
  border-radius: 12px;
  .header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    font-weight: 400;
    line-height: 1.5;
    font-size: 14px;
  }
  .icons {
    display: flex;
    img {
      width: 20px;
      height: 20px;
      margin-right: 5px;
    }
  }
  .ckb-icon {
    width: 20px;
    height: 20px;
    background: url(./static/ckb.svg) no-repeat no-repeat;
    background-size: contain;
  }
  .number {
    margin-top: 3px;
  }
  .time {
    align-self: center;
    display: flex;
    height: 40px;
    align-items: center;
    .ant-typography {
      padding-right: 5px;
    }
  }
  .ant-typography {
    color: white;
  }
  .list-detail {
    padding-top: 10px;
  }
`;
const PrimaryButton = styled(Button)`
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
  height: 32px;
  padding: 0px 16px;
  background-color: rgb(255, 67, 66);
  color: white;
  margin-left: 4px;
  margin-top: 8px;
  &:hover,
  &:focus,
  &:active {
    background-color: rgb(255, 67, 66);
    color: white;
  }
`;
const PlainButton = styled.div`
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
  height: 32px;
  padding: 0px 16px;
  background-color: rgb(60, 58, 75);
  color: white;
  margin-left: 4px;
  margin-top: 8px;
  &:hover,
  &:focus,
  &:active {
    background-color: rgb(60, 58, 75);
    color: white;
  }
`;

export const FixedHeightRow = styled.div`
  height: 24px;
  display: flex;
  justify-content: space-between;
  .ant-typography {
    color: white;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
  }
`;
const UnlockModal = styled(Modal)`
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
  .ant-modal-title {
    color: white;
  }
  .ant-modal-body {
    padding: 20px;
  }
  .ant-modal-close-x {
    color: white;
  }
  .ant-typography {
    color: white;
    display: block;
  }
  .ant-typography.title {
    font-size: 20px;
    padding-bottom: 10px;
  }
  .actions {
    padding-top: 20px;
    display: flex;
    justify-content: center;
  }
  .confirm {
    margin-left: 30px;
  }
  .confirm,
  .cancel {
    border-radius: 6px;
  }
`;

export interface IWithdrawalRequestCardProps {
  remainingBlockNumber: number;
  capacity: HexNumber;
  amount: HexNumber;
  cell: Cell;
  erc20?: ProxyERC20;
  now?: number;
}

const WithdrawalRequestCard = ({
  remainingBlockNumber,
  capacity,
  amount,
  erc20,
  now = 0,
  cell,
}: IWithdrawalRequestCardProps) => {
  const [shouldShowMore, setShouldShowMore] = useState(false);
  const [blockProduceTime, setBlockProduceTime] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const lightGodwoken = useLightGodwoken();

  const handleToggleShowMore = useCallback(() => {
    setShouldShowMore((value) => !value);
  }, []);
  useEffect(() => {
    const fetchBlockProduceTime = async () => {
      const result: number = (await lightGodwoken?.getBlockProduceTime()) || 0;
      setBlockProduceTime(result);
    };
    fetchBlockProduceTime();
  }, [lightGodwoken]);

  const estimatedArrivalDate = useMemo(
    () => Date.now() + remainingBlockNumber * blockProduceTime,
    [blockProduceTime, remainingBlockNumber],
  );
  const estimatedSecondsLeft = useMemo(() => Math.max(0, estimatedArrivalDate - now), [now, estimatedArrivalDate]);
  const isMature = useMemo(() => remainingBlockNumber === 0, [remainingBlockNumber]);

  const {
    days: daysLeft,
    hours: hoursLeft,
    minutes: minutesLeft,
    seconds: secondsLeft,
  } = useMemo(() => getTimePeriods(estimatedSecondsLeft / 1000), [estimatedSecondsLeft]);
  const [ckbAmount, ckbFullAmount] = useMemo(() => {
    if (capacity === "0") {
      console.error("[warn] a withdrawal request cell with zero capacity");
      return ["", ""];
    }
    const capacityBI = BigInt(capacity);
    return [`${getDisplayAmount(capacityBI, 8)} CKB`, `${getFullDisplayAmount(capacityBI, 8)} CKB`];
  }, [capacity]);

  const [sudtAmount, sudtFullAmount] = useMemo(() => {
    if (amount === "" || !erc20) {
      return ["", ""];
    }
    const amountBI = BigInt(amount);

    return [
      `${getDisplayAmount(amountBI, erc20.decimals)} ${erc20.symbol}`,
      `${getFullDisplayAmount(amountBI, erc20.decimals)} ${erc20.symbol}`,
    ];
  }, [amount, erc20]);

  const unlock = async () => {
    setIsUnlocking(true);
    const txHash = await lightGodwoken?.unlock({ cell });
    setIsUnlocking(false);
    const linkToExplorer = () => {
      window.open(`https://explorer.nervos.org/aggron/transaction/${txHash}`, "_blank");
    };
    setIsModalVisible(false);
    notification.success({ message: `Unlock Tx(${txHash}) is successful`, onClick: linkToExplorer });
  };

  const showCurrencySelectModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <StyleWrapper onClick={isMature ? undefined : handleToggleShowMore}>
      <div className="header">
        <div className="amount">
          <div className="icons">
            {erc20?.tokenURI ? <img src={erc20?.tokenURI} alt="" /> : ""}
            <div className="ckb-icon"></div>
          </div>
          <div className="number">
            {sudtAmount}
            {sudtAmount === "" ? "" : " and "}
            {ckbAmount}
          </div>
        </div>
        {isMature ? (
          <PrimaryButton className="withdraw-button" onClick={showCurrencySelectModal}>
            withdraw
          </PrimaryButton>
        ) : shouldShowMore ? (
          <div className="time">
            <UpOutlined />
          </div>
        ) : (
          <div className="time">
            <Text title="Estimated time left">
              {daysLeft > 0
                ? `${daysLeft}${daysLeft > 1 ? " days" : " day"}`
                : `${hoursLeft > 0 ? `${hoursLeft.toString().padStart(2, "0")}:` : ""}${minutesLeft
                    .toString()
                    .padStart(2, "0")}:${secondsLeft.toString().padStart(2, "0")}`}
            </Text>
            <DownOutlined />
          </div>
        )}
      </div>
      {shouldShowMore && (
        <div className="list-detail">
          <FixedHeightRow>
            <Text>Blocks remaining:</Text>
            <Text>{remainingBlockNumber}</Text>
          </FixedHeightRow>
          <FixedHeightRow>
            <Text>Estimated time left:</Text>
            <Text>
              {`${daysLeft > 0 ? `${daysLeft}${daysLeft > 1 ? " days " : " day "}` : ""}${hoursLeft
                .toString()
                .padStart(2, "0")}:${minutesLeft.toString().padStart(2, "0")}:${secondsLeft
                .toString()
                .padStart(2, "0")}`}
            </Text>
          </FixedHeightRow>
        </div>
      )}
      <UnlockModal
        title="Withdraw to Wallet"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
      >
        <Text className="title">Confirm Unlock Withdrawal to below address</Text>
        <Text>{lightGodwoken?.provider.getL1Address()}</Text>
        <div className="actions">
          <PlainButton className="cancel" onClick={handleCancel}>
            Cancel
          </PlainButton>
          <PrimaryButton className="confirm" onClick={unlock} loading={isUnlocking}>
            Confirm
          </PrimaryButton>
        </div>
      </UnlockModal>
    </StyleWrapper>
  );
};

export default WithdrawalRequestCard;
