import React, { useState } from "react";
import styled from "styled-components";
import { notification } from "antd";
import { Cell } from "@ckb-lumos/lumos";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { isInstanceOfLightGodwokenV0 } from "../../utils/typeAssert";
import { CKB_EXPLORER_URL } from "../../config";
import { Actions, ConfirmModal, PlainButton, SecondeButton, Text } from "../../style/common";

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
      <SecondeButton className="withdraw-button" onClick={showCurrencySelectModal}>
        unlock
      </SecondeButton>
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
          <Actions>
            <PlainButton className="cancel" onClick={handleCancel}>
              Cancel
            </PlainButton>
            <SecondeButton className="confirm" onClick={unlock}>
              Confirm
            </SecondeButton>
          </Actions>
        </ModalContent>
      </ConfirmModal>
    </div>
  );
};

export default Unlock;
