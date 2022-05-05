import React, { useState, useCallback, useEffect, useMemo } from "react";
import styled from "styled-components";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import getTimePeriods from "../../utils/getTimePeriods";
import { getDisplayAmount } from "../../utils/formatTokenAmount";
import { BI, Cell, HexNumber } from "@ckb-lumos/lumos";
import { ProxyERC20 } from "../../light-godwoken/lightGodwokenType";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
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

export interface IWithdrawalRequestCardProps {
  remainingBlockNumber: number;
  capacity: HexNumber;
  amount: HexNumber;
  cell: Cell;
  erc20?: ProxyERC20;
  now?: number;
  unlockButton?: (cell: Cell) => JSX.Element;
}
const WithdrawalRequestCard = ({
  remainingBlockNumber,
  capacity,
  amount,
  erc20,
  now = 0,
  cell,
  unlockButton,
}: IWithdrawalRequestCardProps) => {
  const [shouldShowMore, setShouldShowMore] = useState(false);
  const [blockProduceTime, setBlockProduceTime] = useState(0);
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
  const [CKBAmount] = useMemo(() => {
    if (capacity === "0") {
      console.error("[warn] a withdrawal request cell with zero capacity");
      return ["", ""];
    }
    const capacityBI = BI.from(capacity);
    return [`${getDisplayAmount(capacityBI, 8)} CKB`];
  }, [capacity]);

  const [sudtAmount] = useMemo(() => {
    if (amount === "" || !erc20) {
      return ["", ""];
    }
    const amountBI = BI.from(amount);

    return [`${getDisplayAmount(amountBI, erc20.decimals)} ${erc20.symbol}`];
  }, [amount, erc20]);
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
            {CKBAmount}
          </div>
        </div>
        {isMature ? (
          unlockButton && unlockButton(cell)
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
    </StyleWrapper>
  );
};

export default WithdrawalRequestCard;
