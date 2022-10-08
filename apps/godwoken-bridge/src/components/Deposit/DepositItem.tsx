import React, { useState, useMemo } from "react";
import styled from "styled-components";
import { getDisplayAmount } from "../../utils/formatTokenAmount";
import { BI } from "@ckb-lumos/lumos";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { ReactComponent as CKBIcon } from "../../assets/ckb.svg";
import { Actions, ConfirmModal, LoadingWrapper, MainText, PlainButton, SecondeButton, Tips } from "../../style/common";

import { COLOR } from "../../style/variables";
import { useClock } from "../../hooks/useClock";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { notification, Tooltip } from "antd";
import { DepositHistoryType } from "../../hooks/useDepositTxHistory";
import { parse } from "date-fns";
import { DATE_FORMAT } from "../../utils/dateUtils";

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
    flex-wrap: wrap;
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
    .ckb-icon {
      display: flex;
      align-items: center;
    }
    .ckb-amount {
      display: flex;
    }
    .sudt-amount + .ckb-amount {
      margin-top: 6px;
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
    margin-top: 10px;
    padding-top: 10px;
    width: 100%;
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

const DepositItem = ({ capacity, amount, token, status, txHash, date, cancelTimeout }: DepositHistoryType) => {
  const lightGodwoken = useLightGodwoken();
  const now = useClock();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCancel, setIsCancel] = useState(false);
  const l1ScannerUrl = lightGodwoken?.getConfig().layer1Config.SCANNER_URL;
  const [CKBAmount] = useMemo(() => {
    return [`${getDisplayAmount(BI.from(capacity), 8)} CKB`];
  }, [capacity]);

  const [sudtAmount] = useMemo(() => {
    if (BI.from(amount).eq(0) || !token) {
      return ["", ""];
    }
    return [`${getDisplayAmount(BI.from(amount), token.decimals)} ${token.symbol}`];
  }, [amount, token]);

  cancelTimeout = lightGodwoken?.getCancelTimeout() || 0;
  const estimatedArrivalDate = useMemo(
    () => parse(date, DATE_FORMAT, new Date()).getTime() + cancelTimeout * 1000,
    [cancelTimeout, date],
  );
  const estimatedSecondsLeft = useMemo(() => Math.max(0, estimatedArrivalDate - now), [now, estimatedArrivalDate]);
  const cancelable = useMemo(() => estimatedSecondsLeft === 0, [estimatedSecondsLeft]);

  const cancelDeposit = async () => {
    setIsCancel(true);
    try {
      await lightGodwoken?.cancelDeposit(txHash, cancelTimeout);
      notification.success({ message: "Cancel deposit success" });
    } catch (error) {
      if (error instanceof Error) {
        notification.error({ message: error.message });
      }
      throw error;
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
          {status === "pending" &&
            (cancelable ? (
              <SecondeButton onClick={showModal}>cancel</SecondeButton>
            ) : (
              <span>
                <Tooltip
                  title={
                    "This deposit will be committed in a few minutes, you can cancel deposit here if it takes longer than 7 days."
                  }
                >
                  <QuestionCircleOutlined style={{ color: "#00CC9B", height: "21px", lineHeight: "21px" }} />
                </Tooltip>
              </span>
            ))}
          {status === "success" && (
            <Tooltip title={status}>
              <CheckCircleOutlined style={{ color: "#00CC9B", height: "21px", lineHeight: "21px" }} />
            </Tooltip>
          )}
          {status === "fail" && (
            <Tooltip title="User canceled deposit">
              <ExclamationCircleOutlined style={{ color: COLOR.warn, height: "21px", lineHeight: "21px" }} />
            </Tooltip>
          )}
          {status === "rejected" && (
            <Tooltip title="The tx is rejected on chain">
              <ExclamationCircleOutlined style={{ color: COLOR.error, height: "21px", lineHeight: "21px" }} />
            </Tooltip>
          )}
        </div>
        <div className="list-detail">
          <MainText title={txHash}>
            <a target="blank" href={`${l1ScannerUrl}/transaction/${txHash}`}>
              Open In Explorer
            </a>
          </MainText>
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
