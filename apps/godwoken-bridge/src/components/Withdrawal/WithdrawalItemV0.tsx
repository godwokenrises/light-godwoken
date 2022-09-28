import React, { useState, useCallback, useEffect, useMemo } from "react";
import styled from "styled-components";
import { Tooltip } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, FieldTimeOutlined } from "@ant-design/icons";
import { BI, Cell, HexNumber, HexString } from "@ckb-lumos/lumos";
import { ProxyERC20 } from "light-godwoken";
import getTimePeriods from "../../utils/getTimePeriods";
import { getDisplayAmount } from "../../utils/formatTokenAmount";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { ReactComponent as CKBIcon } from "../../assets/ckb.svg";
import { ReactComponent as ArrowDownIcon } from "../../assets/arrow-down.svg";
import { ReactComponent as ArrowUpIcon } from "../../assets/arrow-up.svg";
import { MainText } from "../../style/common";
import { COLOR } from "../../style/variables";
import { TokenInfoWithAmount } from "./TokenInfoWithAmount";
import Unlock from "./Unlock";

const StyleWrapper = styled.div`
  background: #f3f3f3;
  padding: 16px;
  border-radius: 12px;
  & + & {
    margin-top: 16px;
  }
  .main-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    font-weight: 400;
    line-height: 1.5;
    font-size: 14px;
  }
  .amount {
    display: flex;
    flex-direction: column;
    justify-content: center;
    img,
    svg {
      width: 22px;
      height: 22px;
      margin-right: 5px;
    }
    .ckb-amount {
      display: flex;
    }
    .sudt-amount + .ckb-amount {
      margin-top: 10px;
    }
  }
  .right-side {
    height: 40px;
    display: flex;
    align-self: center;
    align-items: center;
    justify-content: center;
  }
  .time {
    font-size: 12px;
    color: ${COLOR.secondary};
    svg {
      margin-left: 5px;
    }
  }
  .list-detail {
    padding-top: 10px;
    border-top: 1px dashed rgba(0, 0, 0, 0.2);
    a {
      color: ${COLOR.brand};
      text-decoration: none;
    }
  }
`;

export const FixedHeightRow = styled.div`
  height: 24px;
  display: flex;
  justify-content: space-between;
  .ant-typography {
    color: black;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
  }
`;

export interface IWithdrawalRequestCardProps {
  remainingBlockNumber?: number;
  capacity: HexNumber;
  amount: HexNumber;
  cell?: Cell;
  erc20?: ProxyERC20;
  now?: number;
  layer1TxHash?: HexString;
  isFastWithdrawal: boolean;
  status: "pending" | "available" | "succeed" | "failed";
}
const WithdrawalRequestCard = ({
  remainingBlockNumber = 0,
  capacity,
  amount,
  status,
  erc20,
  cell,
  now = 0,
  layer1TxHash,
  isFastWithdrawal,
}: IWithdrawalRequestCardProps) => {
  const [shouldShowMore, setShouldShowMore] = useState(false);
  const [blockProduceTime, setBlockProduceTime] = useState(0);
  const lightGodwoken = useLightGodwoken();
  const l1ScannerUrl = lightGodwoken?.getConfig().layer1Config.SCANNER_URL;

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
  const isDue = daysLeft === 0 && hoursLeft === 0 && minutesLeft === 0 && secondsLeft === 0;
  const countdownText =
    daysLeft > 0
      ? `${daysLeft}+${daysLeft > 1 ? " days" : " day"} left`
      : `${hoursLeft > 0 ? `${hoursLeft.toString().padStart(2, "0")}:` : ""}${minutesLeft
          .toString()
          .padStart(2, "0")}:${secondsLeft.toString().padStart(2, "0")}`;
  const [CKBAmount] = useMemo(() => {
    if (capacity === "0") {
      console.error("[warn] a withdrawal request cell with zero capacity");
      return ["", ""];
    }
    const capacityBI = BI.from(capacity);
    return [`${getDisplayAmount(capacityBI, 8)} CKB`];
  }, [capacity]);

  const handleToggleShowMore = useCallback(() => {
    if (isMature) return;
    setShouldShowMore((value) => !value);
  }, [isMature]);

  return (
    <StyleWrapper onClick={handleToggleShowMore}>
      <div className="main-row">
        <div className="amount">
          {erc20 && <TokenInfoWithAmount amount={amount} {...erc20} />}
          <div className="ckb-amount">
            <div className="ckb-icon">
              <CKBIcon />
            </div>
            <MainText>{CKBAmount}</MainText>
            {isFastWithdrawal && (
              <span className="fast-withdrawal-icon" style={{ marginLeft: 8 }}>
                <Tooltip title="This is a fast withdrawal, target is godwoken v1 network">
                  <FieldTimeOutlined style={{ color: "#00CC9B", height: "21px", lineHeight: "21px" }} />
                </Tooltip>
              </span>
            )}
          </div>
        </div>
        <div className="right-side">
          {status === "pending" && shouldShowMore && (
            <div className="time">
              <ArrowUpIcon />
            </div>
          )}
          {status === "pending" && !shouldShowMore && (
            <div className="time">
              <MainText title="Estimated time left">{isDue ? "Unlocking, please wait..." : countdownText}</MainText>
              {isDue ? null : <ArrowDownIcon />}
            </div>
          )}
          {status === "available" && cell && <Unlock cell={cell} erc20={erc20} />}
          {status === "succeed" && (
            <Tooltip title={status}>
              <CheckCircleOutlined style={{ color: "#00CC9B", height: "21px", lineHeight: "21px" }} />
            </Tooltip>
          )}
          {status === "failed" && (
            <Tooltip title="Withdrawal failed">
              <CloseCircleOutlined style={{ color: "#D03A3A", height: "21px", lineHeight: "21px" }} />
            </Tooltip>
          )}
        </div>
      </div>
      {status === "succeed" && (
        <div className="list-detail">
          <FixedHeightRow>
            <MainText title={layer1TxHash}>
              <a target="blank" href={`${l1ScannerUrl}/transaction/${layer1TxHash}`}>
                Open In Explorer
              </a>
            </MainText>
          </FixedHeightRow>
        </div>
      )}
      {shouldShowMore && (
        <div className="list-detail">
          <FixedHeightRow>
            <MainText>Blocks remaining:</MainText>
            <MainText>{remainingBlockNumber}</MainText>
          </FixedHeightRow>
          <FixedHeightRow>
            <MainText>Estimated time left:</MainText>
            <MainText>
              {`${daysLeft > 0 ? `${daysLeft}${daysLeft > 1 ? " days " : " day "}` : ""}${hoursLeft
                .toString()
                .padStart(2, "0")}:${minutesLeft.toString().padStart(2, "0")}:${secondsLeft
                .toString()
                .padStart(2, "0")}`}
            </MainText>
          </FixedHeightRow>
        </div>
      )}
    </StyleWrapper>
  );
};

export default WithdrawalRequestCard;
