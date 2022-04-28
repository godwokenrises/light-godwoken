import React, { useState } from "react";
import styled from "styled-components";
import { Button, Typography, notification, Modal } from "antd";
import { Cell } from "@ckb-lumos/lumos";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { isInstanceOfLightGodwokenV0 } from "../../utils/typeAssert";
import { CKB_EXPLORER_URL } from "../../config";
const { Text } = Typography;
const PrimaryButton = styled(Button)`
  align-items: center;
  border: 0px;
  border-radius: 16px;
  box-shadow: rgb(14 14 44 / 40%) 0px -1px 0px 0px inset;
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  -webkit-box-pack: center;
  justify-content: center;
  letter-spacing: 0.03em;
  line-height: 1;
  opacity: 1;
  outline: 0px;
  transition: background-color 0.2s ease 0s, opacity 0.2s ease 0s;
  height: 32px;
  padding: 0px 16px;
  background-color: rgb(255, 67, 66);
  color: black;
  margin-left: 4px;
  margin-top: 8px;
  &:hover,
  &:focus,
  &:active {
    background-color: rgb(255, 67, 66);
    color: black;
  }
`;
const PlainButton = styled.div`
  align-items: center;
  border: 0px;
  border-radius: 16px;
  box-shadow: rgb(14 14 44 / 40%) 0px -1px 0px 0px inset;
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  -webkit-box-pack: center;
  justify-content: center;
  letter-spacing: 0.03em;
  line-height: 1;
  opacity: 1;
  outline: 0px;
  transition: background-color 0.2s ease 0s, opacity 0.2s ease 0s;
  height: 32px;
  padding: 0px 16px;
  background-color: white;
  color: black;
  margin-left: 4px;
  margin-top: 8px;
  &:hover,
  &:focus,
  &:active {
    background-color: white;
    color: black;
  }
`;

const UnlockModal = styled(Modal)`
  color: black;
  .ant-modal-content {
    border-radius: 32px;
    background: white;
    box-shadow: rgb(14 14 44 / 10%) 0px 20px 36px -8px, rgb(0 0 0 / 5%) 0px 1px 1px;
    border: 1px solid white;
    color: black;
  }
  .ant-modal-header {
    background: white;
    border: 1px solid white;
    border-top-left-radius: 32px;
    border-top-right-radius: 32px;
    padding: 12px 24px;
    height: 73px;
    display: flex;
    align-items: center;
  }
  .ant-modal-title {
    color: black;
  }
  .ant-modal-body {
    padding: 20px;
  }
  .ant-modal-close-x {
    color: black;
  }
  .ant-typography {
    color: black;
    display: block;
  }
  .ant-typography.title {
    font-size: 20px;
    padding-bottom: 10px;
  }
  .actions {
    padding-top: 20px;
    display: flex;
    justify-content: center;
  }
  .confirm {
    margin-left: 30px;
  }
  .confirm,
  .cancel {
    border-radius: 6px;
  }
`;
export interface Props {
  cell: Cell;
}
const Unlock = ({ cell }: Props) => {
  const lightGodwoken = useLightGodwoken();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  if (lightGodwoken?.getVersion().toString() !== "v0") {
    return <></>;
  }
  const unlock = async () => {
    if (isInstanceOfLightGodwokenV0(lightGodwoken)) {
      setIsUnlocking(true);
      const txHash = await lightGodwoken.unlock({ cell });
      setIsUnlocking(false);
      const linkToExplorer = () => {
        window.open(`${CKB_EXPLORER_URL}/transaction/${txHash}`, "_blank");
      };
      setIsModalVisible(false);
      notification.success({ message: `Unlock Tx(${txHash}) is successful`, onClick: linkToExplorer });
    }
  };

  const showCurrencySelectModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <div>
      <PrimaryButton className="withdraw-button" onClick={showCurrencySelectModal}>
        withdraw
      </PrimaryButton>
      <UnlockModal
        title="Withdraw to Wallet"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
      >
        <Text className="title">Confirm Unlock Withdrawal to below address</Text>
        <Text>{lightGodwoken?.provider.getL1Address()}</Text>
        <div className="actions">
          <PlainButton className="cancel" onClick={handleCancel}>
            Cancel
          </PlainButton>
          <PrimaryButton className="confirm" onClick={unlock} loading={isUnlocking}>
            Confirm
          </PrimaryButton>
        </div>
      </UnlockModal>
    </div>
  );
};

export default Unlock;
