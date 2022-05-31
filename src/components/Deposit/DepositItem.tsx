import React, { useState, useMemo } from "react";
import styled from "styled-components";
import { getDisplayAmount } from "../../utils/formatTokenAmount";
import { BI, Cell } from "@ckb-lumos/lumos";
import { Token } from "../../light-godwoken/lightGodwokenType";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { ReactComponent as CKBIcon } from "../../asserts/ckb.svg";
import { Actions, ConfirmModal, LoadingWrapper, MainText, PlainButton, SecondeButton, Tips } from "../../style/common";

import { COLOR } from "../../style/variables";
import getTimePeriods from "../../utils/getTimePeriods";
import { useClock } from "../../hooks/useClock";
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from "@ant-design/icons";
import { message, Tooltip } from "antd";

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
    &:hover {
      cursor: pointer;
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
  align-items: center;
  .title {
    font-size: 14px;
    padding-bottom: 16px;
    font-weight: bold;
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
`;

export interface Props {
  capacity: BI;
  amount: BI;
  token?: Token;
  rawCell?: Cell;
  cancelTime?: BI;
  status: string;
  txHash: string;
}

const DepositItem = ({
  capacity,
  amount,
  token,
  rawCell,
  status,
  txHash,
  cancelTime = BI.from(7 * 24)
    .mul(3600)
    .mul(1000),
}: Props) => {
  const lightGodwoken = useLightGodwoken();
  const now = useClock();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCancel, setIsCancel] = useState(false);
  const l1ScannerUrl = lightGodwoken?.getConfig().layer1Config.SCANNER_URL;
  const [CKBAmount] = useMemo(() => {
    if (capacity.eq("0")) {
      console.error("[warn] a withdrawal request cell with zero capacity");
      return ["", ""];
    }
    return [`${getDisplayAmount(capacity, 8)} CKB`];
  }, [capacity]);

  const [sudtAmount] = useMemo(() => {
    if (amount.eq(0) || !token) {
      return ["", ""];
    }
    return [`${getDisplayAmount(amount, token.decimals)} ${token.symbol}`];
  }, [amount, token]);

  const estimatedArrivalDate = useMemo(() => Date.now() + cancelTime.toNumber(), [cancelTime]);
  const estimatedSecondsLeft = useMemo(() => Math.max(0, estimatedArrivalDate - now), [now, estimatedArrivalDate]);
  const cancelAble = useMemo(() => estimatedSecondsLeft === 0, [estimatedSecondsLeft]);

  const cancelDeposit = async () => {
    setIsCancel(true);
    if (!rawCell) {
      throw new Error("no raw found");
    }
    try {
      await lightGodwoken?.cancelDeposit(rawCell);
      message.success("cancel deposit request success");
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setIsCancel(false);
      handleCancel();
    }
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

  const goExpoloer = () => {
    window.open(`${l1ScannerUrl}/transaction/${txHash}`, "_blank");
  };
  return (
    <StyleWrapper>
      <div className="main-row">
        <div className="amount" onClick={goExpoloer}>
          {sudtAmount && (
            <div className="sudt-amount">
              {token?.tokenURI ? <img src={token?.tokenURI} alt="" /> : ""}
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
          {status === "pending" && (cancelAble ? <SecondeButton onClick={showModal}>cancel</SecondeButton> : `pending`)}
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
        </div>
      </div>
      <ConfirmModal
        title="Confirm cancel padding deposit ?"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        width={400}
      >
        <ModalContent>
          <div className="amount">
            {sudtAmount && (
              <div className="sudt-amount">
                {token?.tokenURI ? <img src={token?.tokenURI} alt="" /> : ""}
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
