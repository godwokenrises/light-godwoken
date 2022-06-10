import React, { useState, useCallback, useEffect, useMemo } from "react";
import styled from "styled-components";
import getTimePeriods from "../../utils/getTimePeriods";
import { getDisplayAmount } from "../../utils/formatTokenAmount";
import { BI, HexNumber, HexString } from "@ckb-lumos/lumos";
import { ProxyERC20 } from "../../light-godwoken/lightGodwokenType";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { ReactComponent as CKBIcon } from "../../asserts/ckb.svg";
import { ReactComponent as ArrowDownIcon } from "../../asserts/arrow-down.svg";
import { ReactComponent as ArrowUpIcon } from "../../asserts/arrow-up.svg";
import { MainText } from "../../style/common";
import { COLOR } from "../../style/variables";
import { CheckCircleOutlined, CloseCircleOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { useClock } from "../../hooks/useClock";

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
  layer1TxHash?: HexString;
  capacity: HexNumber;
  amount: HexNumber;
  status: string;
  erc20?: ProxyERC20;
  now?: number;
}
const WithdrawalRequestCard = ({
  remainingBlockNumber = 0,
  layer1TxHash,
  capacity,
  amount,
  status,
  erc20,
}: IWithdrawalRequestCardProps) => {
  const [shouldShowMore, setShouldShowMore] = useState(false);
  const [blockProduceTime, setBlockProduceTime] = useState(0);
  const lightGodwoken = useLightGodwoken();
  const now = useClock();
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

  const { minutes: minutesLeft, seconds: secondsLeft } = useMemo(
    () => getTimePeriods(estimatedSecondsLeft / 1000),
    [estimatedSecondsLeft],
  );

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

  const handleToggleShowMore = useCallback(() => {
    if (isMature) return;
    setShouldShowMore((value) => !value);
  }, [isMature]);

  return (
    <StyleWrapper onClick={handleToggleShowMore}>
      <div className="main-row">
        <div className="amount">
          {sudtAmount && (
            <div className="sudt-amount">
              {erc20?.tokenURI ? <img src={erc20?.tokenURI} alt="" /> : ""}
              <MainText>{sudtAmount}</MainText>
            </div>
          )}
          <div className="ckb-amount">
            <div className="ckb-icon">
              <CKBIcon></CKBIcon>
            </div>
            <MainText>{CKBAmount}</MainText>
          </div>
        </div>
        <div className="right-side">
          {status === "pending" &&
            (shouldShowMore ? (
              <div className="time">
                <ArrowUpIcon />
              </div>
            ) : (
              <div className="time">
                <MainText title="Estimated time left">
                  {`${minutesLeft.toString().padStart(2, "0")}:${secondsLeft.toString().padStart(2, "0")}`}
                </MainText>
                <ArrowDownIcon />
              </div>
            ))}
          {status === "success" && (
            <Tooltip title={status}>
              <CheckCircleOutlined style={{ color: "#00CC9B", height: "21px", lineHeight: "21px" }} />
            </Tooltip>
          )}
          {status === "fail" && (
            <Tooltip title={status}>
              <CloseCircleOutlined style={{ color: "#D03A3A", height: "21px", lineHeight: "21px" }} />
            </Tooltip>
          )}
          {status === "l2Pending" && (
            <>
              pending...
              <Tooltip title={"Godwoken withdrawal pending, this transaction will be committed in a few minites."}>
                <QuestionCircleOutlined style={{ color: "#00CC9B", height: "21px", lineHeight: "21px" }} />
              </Tooltip>
            </>
          )}
        </div>
      </div>
      {shouldShowMore && (
        <div className="list-detail">
          <FixedHeightRow>
            <MainText>Blocks remaining:</MainText>
            <MainText>{remainingBlockNumber}</MainText>
          </FixedHeightRow>
          <FixedHeightRow>
            <MainText>Estimated time left:</MainText>
            <MainText>
              {`${minutesLeft.toString().padStart(2, "0")}:${secondsLeft.toString().padStart(2, "0")}`}
            </MainText>
          </FixedHeightRow>
          <FixedHeightRow>
            <MainText>
              Layer 1 Tx: <a href={`${l1ScannerUrl}/transaction/${layer1TxHash}`}>Open In Explorer</a>
            </MainText>
          </FixedHeightRow>
        </div>
      )}
    </StyleWrapper>
  );
};

export default WithdrawalRequestCard;
