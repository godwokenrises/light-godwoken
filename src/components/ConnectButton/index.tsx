import detectEthereumProvider from "@metamask/detect-provider";
import { Button, Modal, Typography } from "antd";
import { useState } from "react";
import styled from "styled-components";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { Address } from "../Address";
const { Text } = Typography;
const ButtonWrapper = styled(Button)`
  &.ant-btn-primary {
    background: rgb(255, 67, 66);
    border: none;
  }
`;
const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px;
  .ant-typography {
    color: white;
    font-size: 16px;
    text-align: center;
    padding-bottom: 20px;
  }
`;
const StyleWrapper = styled.div``;
const ConnectModal = styled(Modal)`
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
    padding: 0px;
  }
  .ant-modal-close-x {
    color: white;
  }
  .ant-list-item {
    border-bottom: none;
    padding: 4px 20px;
    height: 56px;
    &:hover {
      background-color: rgb(60, 58, 75);
      cursor: pointer;
    }
    &.selected {
      background-color: rgb(60, 58, 75);
    }
  }
`;
export const ConnectButton: React.FC = () => {
  const lightGodwoken = useLightGodwoken();
  const [isModalVisible, setIsModalVisible] = useState(true);

  function connectWallet() {
    if (lightGodwoken) return;

    detectEthereumProvider()
      .then((ethereum: any) => {
        return ethereum.request({ method: "eth_requestAccounts" });
      })
      .then(() => {
        setIsModalVisible(false);
      });
  }

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <StyleWrapper>
      {lightGodwoken && <Address />}
      {!lightGodwoken && (
        <ConnectModal
          title="Connect Wallet"
          visible={isModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
          footer={null}
        >
          <ModalBody>
            <Text>you need to install and connect to metamask before you use Light Godwoken</Text>
            <ButtonWrapper type="primary" onClick={connectWallet}>
              connect
            </ButtonWrapper>
          </ModalBody>
        </ConnectModal>
      )}
    </StyleWrapper>
  );
};
