/* eslint-disable */
import React, { useState, useCallback, useEffect, useMemo } from "react";
import styled from "styled-components";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Typography, notification, Modal } from "antd";
import getTimePeriods from "../../utils/getTimePeriods";
import { getDisplayAmount, getFullDisplayAmount } from "../../utils/formatTokenAmount";
import { Cell, HexNumber } from "@ckb-lumos/lumos";
import { ProxyERC20 } from "../../light-godwoken/lightGodwokenType";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { Link, useParams } from "react-router-dom";
import DefaultLightGodwokenV0 from "../../light-godwoken/LightGodwokenV0";
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
  color: white;
  margin-left: 4px;
  margin-top: 8px;
  &:hover,
  &:focus,
  &:active {
    background-color: rgb(255, 67, 66);
    color: white;
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
  background-color: rgb(60, 58, 75);
  color: white;
  margin-left: 4px;
  margin-top: 8px;
  &:hover,
  &:focus,
  &:active {
    background-color: rgb(60, 58, 75);
    color: white;
  }
`;

const UnlockModal = styled(Modal)`
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
  .ant-modal-title {
    color: white;
  }
  .ant-modal-body {
    padding: 20px;
  }
  .ant-modal-close-x {
    color: white;
  }
  .ant-typography {
    color: white;
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
    if (lightGodwoken instanceof DefaultLightGodwokenV0) {
      setIsUnlocking(true);
      const txHash = await lightGodwoken?.unlock({ cell });
      setIsUnlocking(false);
      const linkToExplorer = () => {
        window.open(`https://explorer.nervos.org/aggron/transaction/${txHash}`, "_blank");
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
