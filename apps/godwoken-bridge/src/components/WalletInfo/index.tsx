import React, { useEffect, useState } from "react";
import copy from "copy-to-clipboard";
import styled from "styled-components";
import { BI } from "@ckb-lumos/lumos";
import { Icon } from "@ricons/utils";
import { ContentCopyOutlined, QrCodeOutlined } from "@ricons/material";
import { message, Tooltip } from "antd";
import { PrimaryText, Text } from "../../style/common";
import { Placeholder } from "../Placeholder";
import { getDisplayAmount } from "../../utils/formatTokenAmount";
import { formatToThousands } from "../../utils/numberFormat";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { QrCodeModal } from "../QrCodeModal";

const StyleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 16px;

  .title {
    font-weight: bold;
  }

  .address-col {
    display: flex;
    align-items: center;
    justify-content: space-between;

    & + .address-col {
      margin-top: 10px;
    }
    .address {
      display: block;
    }
    .actions {
      display: flex;
    }
  }
`;

const ActionButton = styled.button`
  padding: 8px;
  flex: none;
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 16px;
  border-radius: 8px;
  border: 1px solid #e3e3e3;
  background-color: #fff;
  color: #00cc98;

  & + && {
    margin-left: 4px;
  }
  &:hover {
    color: #068462;
    border: 1px solid #00cc98;
    background-color: #fbfbfb;
  }
`;

const BalanceRow = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
`;

const CopyRow = styled.div`
  margin-top: 16px;
  padding: 8px 12px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  background-color: #fbfbfb;

  .copy-group {
    margin-right: 16px;
    text-align: left;
  }
  .copy-title {
    color: #666666;
    font-size: 13px;
    font-weight: 700;
  }
  .copy-text {
    flex: auto;
    word-break: break-all;
    font-size: 12px;
  }
`;

export interface WalletInfoProps {
  l1Address?: string;
  l1Balance?: string;
  l2Balance?: string;
  ethAddress?: string;
  depositAddress?: string;
}

export interface QrCodeValue {
  title: string;
  value: string;
}

export const WalletInfo: React.FC<WalletInfoProps> = (props) => {
  const { l1Address, ethAddress, depositAddress, l1Balance, l2Balance } = props;

  const lightGodwoken = useLightGodwoken();
  const decimals = lightGodwoken?.getNativeAsset().decimals;

  const [qr, setQr] = useState<QrCodeValue | undefined>();
  const [qrVisible, setQrVisible] = useState(false);
  function onCloseQrCodeModal() {
    setQrVisible(false);
  }
  useEffect(() => {
    if (lightGodwoken && qr) {
      onCloseQrCodeModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightGodwoken]);

  function showQrCode(title: string, value?: string) {
    if (!value) {
      message.error(`${title} is not ready`);
      return;
    }

    setQr({ title, value });
    setQrVisible(true);
  }
  function copyValue(title: string, value?: string) {
    if (!value) {
      message.error(`${title} is not ready`);
      return;
    }

    copy(value);
    message.success(`${title} is copied`);
  }
  function truncateMiddle(str: string, first = 40, last = 6) {
    return str.substring(0, first) + "..." + str.substring(str.length - last);
  }

  return (
    <StyleWrapper>
      <div className="address-col">
        <div>
          <Text className="title">L1 Wallet Address</Text>
          <PrimaryText className="address">
            {l1Address ? truncateMiddle(l1Address, 11, 11) : <Placeholder />}
          </PrimaryText>
        </div>

        <div className="actions">
          <Tooltip title="Check QR code">
            <ActionButton className="button" onClick={() => showQrCode("L1 Wallet Address", l1Address)}>
              <Icon>
                <QrCodeOutlined />
              </Icon>
            </ActionButton>
          </Tooltip>
          <Tooltip title="Copy address">
            <ActionButton className="button" onClick={() => copyValue("L1 Wallet Address", l1Address)}>
              <Icon>
                <ContentCopyOutlined />
              </Icon>
            </ActionButton>
          </Tooltip>
        </div>
      </div>

      <div className="address-col">
        <div>
          <Text className="title">L1 Deposit Address</Text>
          <PrimaryText className="address">
            {depositAddress ? truncateMiddle(depositAddress, 11, 11) : <Placeholder />}
          </PrimaryText>
        </div>

        <div className="actions">
          <Tooltip title="Check QR code">
            <ActionButton className="button" onClick={() => showQrCode("L1 Deposit Address", depositAddress)}>
              <Icon>
                <QrCodeOutlined />
              </Icon>
            </ActionButton>
          </Tooltip>
          <Tooltip title="Copy address">
            <ActionButton className="button" onClick={() => copyValue("L1 Deposit Address", depositAddress)}>
              <Icon>
                <ContentCopyOutlined />
              </Icon>
            </ActionButton>
          </Tooltip>
        </div>
      </div>

      <div className="address-col">
        <div>
          <Text className="title">Ethereum Address</Text>
          <PrimaryText className="address">
            {ethAddress ? truncateMiddle(ethAddress, 5, 4) : <Placeholder />}
          </PrimaryText>
        </div>

        <div className="actions">
          <Tooltip title="Check QR code">
            <ActionButton className="button" onClick={() => showQrCode("Ethereum Address", ethAddress)}>
              <Icon>
                <QrCodeOutlined />
              </Icon>
            </ActionButton>
          </Tooltip>
          <Tooltip title="Copy address">
            <ActionButton className="button" onClick={() => copyValue("Ethereum Address", ethAddress)}>
              <Icon>
                <ContentCopyOutlined />
              </Icon>
            </ActionButton>
          </Tooltip>
        </div>
      </div>

      <BalanceRow>
        <Text className="title">L1 Balance</Text>
        <PrimaryText>
          {l1Balance ? formatToThousands(getDisplayAmount(BI.from(l1Balance), 8)) + " CKB" : <Placeholder />}
        </PrimaryText>
      </BalanceRow>
      <BalanceRow>
        <Text className="title">L2 Balance</Text>
        <PrimaryText>
          {l2Balance ? formatToThousands(getDisplayAmount(BI.from(l2Balance), decimals)) + " CKB" : <Placeholder />}
        </PrimaryText>
      </BalanceRow>

      {qr && (
        <QrCodeModal
          title="Address Details"
          value={qr.value}
          visible={qrVisible}
          append={
            <CopyRow>
              <div className="copy-group">
                <div className="copy-title">{qr.title}</div>
                <div className="copy-text">{qr.value}</div>
              </div>
              <ActionButton className="button" onClick={() => copyValue(qr.title, qr.value)}>
                <Icon>
                  <ContentCopyOutlined />
                </Icon>
              </ActionButton>
            </CopyRow>
          }
          onClose={onCloseQrCodeModal}
        />
      )}
    </StyleWrapper>
  );
};
