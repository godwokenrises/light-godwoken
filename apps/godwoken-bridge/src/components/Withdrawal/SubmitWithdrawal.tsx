import React, { useState } from "react";
import {
  Actions,
  ConfirmModal,
  InputInfo,
  LoadingWrapper,
  MainText,
  PlainButton,
  PrimaryButton,
  SecondeButton,
  Text,
  Tips,
} from "../../style/common";
import { ReactComponent as CKBIcon } from "../../assets/ckb.svg";
import styled from "styled-components";
import { formatToThousands } from "../../utils/numberFormat";
import { LoadingOutlined } from "@ant-design/icons";

const TimeInfo = styled.div`
  width: 100%;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  .title {
    font-weight: bold;
  }
`;

interface Props {
  sendWithdrawal: () => void;
  loading: boolean;
  blockWait: string;
  estimatedTime: string;
  CKBInput: string;
  sudtInput: string;
  tokenURI?: string;
  sudtSymbol?: string;
  disabled?: boolean;
  buttonText?: string;
}
const SubmitWithdrawal: React.FC<Props> = ({
  buttonText,
  sendWithdrawal,
  disabled,
  loading,
  blockWait,
  estimatedTime,
  CKBInput,
  sudtInput,
  tokenURI,
  sudtSymbol,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };
  const handleSubmit = async () => {
    await sendWithdrawal();
    setIsModalVisible(false);
  };

  return (
    <>
      <PrimaryButton className="submit-button" disabled={disabled} onClick={showModal}>
        {buttonText || "Request Withdrawal"}
      </PrimaryButton>
      <ConfirmModal
        title="Confirm Request"
        visible={isModalVisible || loading}
        onCancel={handleCancel}
        footer={null}
        width={400}
      >
        <InputInfo>
          <span className="title">Withdrawing</span>
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
                {tokenURI ? <img src={tokenURI} alt="" /> : ""}
                <MainText>{sudtSymbol}</MainText>
              </div>
            )}
          </div>
        </InputInfo>
        <TimeInfo>
          <MainText className="title">Block wait</MainText>
          <Text>{blockWait}</Text>
        </TimeInfo>
        <TimeInfo>
          <MainText className="title">Estimated time</MainText>
          <Text>~{estimatedTime}</Text>
        </TimeInfo>
        <Tips>
          Layer 2 assets will be locked in Withdrawal Request, available to withdraw to Layer 1 after maturity.
        </Tips>
        {loading && (
          <>
            <LoadingWrapper>
              <LoadingOutlined />
            </LoadingWrapper>
            <Tips>Waiting for User Confirmation</Tips>
          </>
        )}
        {!loading && (
          <>
            <Actions>
              <PlainButton onClick={handleCancel}>Cancel</PlainButton>
              <SecondeButton /*loading={loading}*/ onClick={() => handleSubmit()}>Confirm</SecondeButton>
            </Actions>
          </>
        )}
      </ConfirmModal>
    </>
  );
};
export default SubmitWithdrawal;
