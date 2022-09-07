import React from "react";
import QrCode from "react-qr-code";
import styled from "styled-components";
import { ModalProps } from "antd";
import { ConfirmModal } from "../../style/common";

export interface QRCodeModalProps {
  title: string;
  value: string;
  visible: boolean;
  append?: JSX.Element;
  onClose?: ModalProps["onOk"];
}

const QrCodeModalStyle = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;

  .append {
    width: 100%;
    padding: 14px 0;
    text-align: center;
  }
`;

export const QrCodeModal: React.FC<QRCodeModalProps> = (props) => {
  return (
    <ConfirmModal
      title={props.title}
      visible={props.visible}
      onOk={props.onClose}
      onCancel={props.onClose}
      footer={null}
      width={400}
    >
      <QrCodeModalStyle>
        <QrCode value={props.value} />
        {props.append && <div className="append">{props.append}</div>}
      </QrCodeModalStyle>
    </ConfirmModal>
  );
};
