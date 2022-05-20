import React, { useState, useMemo } from "react";
import styled from "styled-components";
import { getDisplayAmount } from "../../utils/formatTokenAmount";
import { BI, Cell } from "@ckb-lumos/lumos";
import { SUDT } from "../../light-godwoken/lightGodwokenType";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { ReactComponent as CKBIcon } from "../../asserts/ckb.svg";
import {
  Actions,
  ConfirmModal,
  LoadingWrapper,
  MainText,
  PlainButton,
  SecondeButton,
  Text,
  Tips,
} from "../../style/common";

import { COLOR } from "../../style/variables";
import getTimePeriods from "../../utils/getTimePeriods";
import { useClock } from "../../hooks/useClock";
import { LoadingOutlined } from "@ant-design/icons";

const StyleWrapper = styled.div`
  background: #f3f3f3;
  padding: 16px;
  border-radius: 12px;
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

const ModalContent = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  .title {
    font-size: 14px;
    padding-bottom: 16px;
    font-weight: bold;
  }
`;

export interface Props {
  capacity: BI;
  amount: BI;
  sudt?: SUDT;
  rawCell: Cell;
  cancelTime: BI;
}
const DepositItem = ({ capacity, amount, sudt, rawCell, cancelTime }: Props) => {
  const lightGodwoken = useLightGodwoken();
  const now = useClock();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCancel, setIsCancel] = useState(false);

  const [CKBAmount] = useMemo(() => {
    if (capacity.eq("0")) {
      console.error("[warn] a withdrawal request cell with zero capacity");
      return ["", ""];
    }
    return [`${getDisplayAmount(capacity, 8)} CKB`];
  }, [capacity]);

  const [sudtAmount] = useMemo(() => {
    if (amount.eq(0) || !sudt) {
      return ["", ""];
    }
    return [`${getDisplayAmount(amount, sudt.decimals)} ${sudt.symbol}`];
  }, [amount, sudt]);

  const estimatedArrivalDate = useMemo(() => Date.now() + cancelTime.toNumber(), [cancelTime]);
  const estimatedSecondsLeft = useMemo(() => Math.max(0, estimatedArrivalDate - now), [now, estimatedArrivalDate]);
  const cancelAble = useMemo(() => estimatedSecondsLeft === 0, [estimatedSecondsLeft]);

  const {
    days: daysLeft,
    hours: hoursLeft,
    minutes: minutesLeft,
    seconds: secondsLeft,
  } = useMemo(() => getTimePeriods(estimatedSecondsLeft / 1000), [estimatedSecondsLeft]);

  const cancelDeposit = async () => {
    setIsCancel(true);
    await lightGodwoken?.cancelDeposit(rawCell);
    setIsCancel(false);
    handleCancel();
  };

  const showModal = () => {
    setIsModalVisible(true);
  };
  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };
  return (
    <StyleWrapper>
      <div className="main-row">
        <div className="amount">
          {sudtAmount && (
            <div className="sudt-amount">
              {sudt?.tokenURI ? <img src={sudt?.tokenURI} alt="" /> : ""}
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
          {cancelAble ? (
            <SecondeButton onClick={showModal}>cancel</SecondeButton>
          ) : (
            <MainText title="Estimated time left">
              {daysLeft > 0
                ? `${daysLeft}+${daysLeft > 1 ? " days" : " day"} left`
                : `${hoursLeft > 0 ? `${hoursLeft.toString().padStart(2, "0")}:` : ""}${minutesLeft
                    .toString()
                    .padStart(2, "0")}:${secondsLeft.toString().padStart(2, "0")}`}
            </MainText>
          )}
        </div>
      </div>
      <ConfirmModal
        title="Unlock Withdrawal"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        width={400}
      >
        <ModalContent>
          <Text className="title">Unlock withdraw to below address</Text>
          <Text>{lightGodwoken?.provider.getL1Address()}</Text>
          {isCancel && (
            <LoadingWrapper>
              <LoadingOutlined />
            </LoadingWrapper>
          )}
          {isCancel && <Tips>Waiting for User Confirmation</Tips>}

          <Actions>
            <PlainButton className="cancel" onClick={handleCancel}>
              Cancel
            </PlainButton>
            <SecondeButton className="confirm" onClick={cancelDeposit} disabled={isCancel}>
              Confirm
            </SecondeButton>
          </Actions>
        </ModalContent>
      </ConfirmModal>
    </StyleWrapper>
  );
};

export default DepositItem;
