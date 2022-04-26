import { Button, Modal, Typography } from "antd";
import React, { useState } from "react";
import { WithdrawalButton } from "./requestWithdrawalStyle";
import styled from "styled-components";
export const ConfirmModal = styled(Modal)`
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
  .ant-modal-title,
  .ant-list-item {
    color: white;
  }
  .ant-modal-body {
    padding: 24px;
  }
  .ant-modal-close-x {
    color: white;
  }
  .ant-typography {
    color: white;
    justify-content: space-between;
  }
  .text-pair {
    padding-top: 5px;
    display: flex;
    justify-content: space-between;
    font-size: 24px;
  }
  .tips {
    margin: 24px 0;
  }
`;
const { Text } = Typography;
interface Props {
  sendWithdrawal: () => void;
  loading: boolean;
  blockWait: string;
  estimatedTime: string;
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
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };
  const handleSubmit = () => {
    sendWithdrawal();
    setIsModalVisible(false);
  };

  return (
    <>
      <WithdrawalButton>
        <Button className="submit-button" disabled={disabled} onClick={showModal}>
          {buttonText || "Request Withdrawal"}
        </Button>
      </WithdrawalButton>
      <ConfirmModal title="Confirm Request" visible={isModalVisible || loading} onCancel={handleCancel} footer={null}>
        <div className="text-pair">
          <Text>Block wait</Text>
          <Text>{blockWait}</Text>
        </div>
        <div className="text-pair">
          <Text>Estimated time</Text>
          <Text>{estimatedTime}</Text>
        </div>
        <div className="tips">
          Layer 2 assets will be locked in Withdrawal Request, available to withdraw to Layer 1 after maturity. Request
          Withdrawal
        </div>
        <WithdrawalButton>
          <Button className="submit-button" loading={loading} onClick={() => handleSubmit()}>
            Request Withdrawal
          </Button>
        </WithdrawalButton>
      </ConfirmModal>
    </>
  );
};
export default SubmitWithdrawal;
