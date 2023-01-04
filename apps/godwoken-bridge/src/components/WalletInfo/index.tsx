import React, { useEffect, useState } from "react";
import copy from "copy-to-clipboard";
import styled from "styled-components";
import { BI } from "@ckb-lumos/lumos";
import { Icon } from "@ricons/utils";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { ContentCopyOutlined, MoreVertRound } from "@ricons/material";
import { message, Tooltip } from "antd";
import { PrimaryText, SecondeButton, Text } from "../../style/common";
import { truncateCkbAddress, truncateDotBitAlias, truncateEthAddress } from "../../utils/stringFormat";
import { getDisplayAmount } from "../../utils/formatTokenAmount";
import { formatToThousands } from "../../utils/numberFormat";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { useDotBitReverseAlias } from "../../hooks/useDotBit";
import { Placeholder } from "../Placeholder";
import { QrCodeModal } from "../QrCodeModal";
import { COLOR } from "../../style/variables";

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
    .help {
      margin-left: 4px;
      color: ${COLOR.primary};
    }
    .alias-icon {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background-color: #f2f2f2;
    }
    .alias-icon-lg {
      width: 16px;
      height: 16px;
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

const DetailRow = styled.div`
  .box {
    margin-top: 16px;
    padding: 8px 12px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 12px;
    border: 1px solid #e8e8e8;
    background-color: #fbfbfb;
  }
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
  .new-tab-button {
    margin-top: 8px;
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
  href: string;
}

export const WalletInfo: React.FC<WalletInfoProps> = (props) => {
  const { l1Address, ethAddress, depositAddress, l1Balance, l2Balance } = props;

  const lightGodwoken = useLightGodwoken();
  const decimals = lightGodwoken?.getNativeAsset().decimals;
  const lightGodwokenConfig = lightGodwoken?.provider.getConfig();

  const dotbitAlias = useDotBitReverseAlias(ethAddress);

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

  function showQrCode(title: string, value?: string, href?: string) {
    if (value && href) {
      setQr({ title, value, href });
      setQrVisible(true);
    }
  }
  function copyValue(title: string, value?: string) {
    if (value) {
      copy(value);
      message.success(`${title} is copied`);
    }
  }
  function getL1BrowserLink(address?: string) {
    if (!address) return void 0;
    const prefix = lightGodwokenConfig?.layer1Config.SCANNER_URL;
    return `${prefix}/address/${address}`;
  }
  function getL2BrowserLink(address?: string) {
    if (!address) return void 0;
    const prefix = lightGodwokenConfig?.layer2Config.SCANNER_URL;
    return `${prefix}/address/${address}`;
  }
  function toUrl(url: string) {
    window.open(url, "_blank");
  }

  return (
    <StyleWrapper>
      <div className="address-col">
        <div>
          <Text className="title">L1 Wallet Address</Text>
          <PrimaryText className="address">{l1Address ? truncateCkbAddress(l1Address) : <Placeholder />}</PrimaryText>
        </div>

        <div className="actions">
          <Tooltip title="Check address details">
            <ActionButton
              className="button"
              onClick={() => showQrCode("L1 Wallet Address", l1Address, getL1BrowserLink(l1Address))}
            >
              <Icon>
                <MoreVertRound />
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
            {depositAddress ? truncateCkbAddress(depositAddress) : <Placeholder />}
          </PrimaryText>
        </div>

        <div className="actions">
          <Tooltip title="Check address details">
            <ActionButton
              className="button"
              onClick={() => showQrCode("L1 Deposit Address", depositAddress, getL1BrowserLink(depositAddress))}
            >
              <Icon>
                <MoreVertRound />
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
          <PrimaryText className="address">{ethAddress ? truncateEthAddress(ethAddress) : <Placeholder />}</PrimaryText>
        </div>

        <div className="actions">
          <Tooltip title="Check address details">
            <ActionButton
              className="button"
              onClick={() => showQrCode("Ethereum Address", ethAddress, getL2BrowserLink(ethAddress))}
            >
              <Icon>
                <MoreVertRound />
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

      <div className="address-col">
        <div>
          <Tooltip
            title="You can give your Ethereum Address a memorable alias, so others can find your address through your .bit account"
            placement="topLeft"
          >
            <Text className="title">
              <span>Address Alias</span>
              <QuestionCircleOutlined className="help" />
            </Text>
          </Tooltip>
          <PrimaryText className="address">
            {dotbitAlias.isLoading && <Placeholder />}
            {!dotbitAlias.isLoading && !dotbitAlias.data && "-"}
            {!dotbitAlias.isLoading && dotbitAlias.data && truncateDotBitAlias(dotbitAlias.data.account)}
          </PrimaryText>
        </div>
        <div className="actions">
          <Tooltip title="Manage alias">
            <ActionButton className="button" onClick={() => toUrl("https://app.did.id/me")}>
              <img src="/static/dotbit.ico" alt="ico" className="alias-icon-lg" />
            </ActionButton>
          </Tooltip>
          {dotbitAlias.data && (
            <Tooltip title="Copy .bit account">
              <ActionButton className="button" onClick={() => copyValue(".bit account", dotbitAlias.data!.account)}>
                <Icon>
                  <ContentCopyOutlined />
                </Icon>
              </ActionButton>
            </Tooltip>
          )}
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
            <DetailRow>
              <div className="box">
                <div className="copy-group">
                  <div className="copy-title">{qr.title}</div>
                  <div className="copy-text">{qr.value}</div>
                </div>
                <ActionButton className="button" onClick={() => copyValue(qr.title, qr.value)}>
                  <Icon>
                    <ContentCopyOutlined />
                  </Icon>
                </ActionButton>
              </div>
              <SecondeButton className="new-tab-button" onClick={() => toUrl(qr.href)}>
                Open in browser
              </SecondeButton>
            </DetailRow>
          }
          onClose={onCloseQrCodeModal}
        />
      )}
    </StyleWrapper>
  );
};
