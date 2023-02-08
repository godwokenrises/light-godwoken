import React from "react";
import { Actions, ConfirmModal, PlainButton, SecondeButton } from "../../style/common";

export interface NetworkMismatchModalProps {
  handleCancel: () => void;
  handleConfirm: () => void;
  networkName: string;
  visible: boolean;
}
export const NetworkMismatchModal: React.FC<NetworkMismatchModalProps> = ({
  visible,
  networkName,
  handleCancel,
  handleConfirm,
}) => {
  return (
    <ConfirmModal
      width={400}
      visible={visible}
      footer={null}
      onCancel={handleCancel}
      maskClosable={false}
      keyboard={false}
    >
      <div style={{ textAlign: "left", paddingTop: 24 }}>
        <h1>Network mismatch</h1>
        <p>
          The current network does not match. Do you want to switch to [ <b>{networkName} </b>] ?
        </p>
      </div>
      <Actions>
        <PlainButton onClick={handleCancel}>Cancel</PlainButton>
        <SecondeButton onClick={handleConfirm}>Confirm</SecondeButton>
      </Actions>
    </ConfirmModal>
  );
};
