import React, { useState } from "react";
import { ConfirmModal, PrimaryButton, Text } from "../../style/common";
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
      <PrimaryButton className="submit-button" disabled={disabled} onClick={showModal}>
        {buttonText || "Request Withdrawal"}
      </PrimaryButton>
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
          Layer 2 assets will be locked in Withdrawal Request, available to withdraw to Layer 1 after maturity.
        </div>
        <PrimaryButton className="submit-button" /*loading={loading}*/ onClick={() => handleSubmit()}>
          Request Withdrawal
        </PrimaryButton>
      </ConfirmModal>
    </>
  );
};
export default SubmitWithdrawal;
