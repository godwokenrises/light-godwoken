import React, { useEffect } from "react";
import styled from "styled-components";
import { COLOR } from "../../style/variables";
import { ConfirmModal } from "../../style/common";
import { connectors } from "./connectors";
import { ReactComponent as MetaMaskIcon } from "../../assets/wallets/metamask.svg";
import { ReactComponent as WalletConnectIcon } from "../../assets/wallets/wallet-connect.svg";
import { ReactComponent as ImTokenIcon } from "../../assets/wallets/imtoken.svg";
import { ReactComponent as SafePalIcon } from "../../assets/wallets/safepal.svg";

const StyleWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
`;

const WalletBoxWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 150px;
  height: 100px;
  color: ${COLOR.primary};
  text-decoration: none;
  cursor: pointer;
  padding: 0 10px;
  border-radius: 8px;
  margin: 10px 10px;
  text-align: center;
  line-height: 33px;
  font-size: 14px;
  font-weight: bold;
  &:hover {
    background: rgba(0, 0, 0, 0.1);
    color: ${COLOR.primary};
  }
  > svg {
    width: 120px;
    height: 80px;
  }
  .title {
    color: ${COLOR.primary};
  }
`;

type SelectMenuProps = {
  handleClick: () => void;
};
export const SelectMenu: React.FC<SelectMenuProps> = ({ handleClick }) => {
  const connectMetamask = () => {
    connectors.injectedConnect.instance.activate().catch((err) => {
      console.error(err);
    });
  };

  const connectImToken = () => {
    connectors.injectedConnect.instance.activate().catch((err) => {
      console.error(err);
    });
  };

  const connectSafePal = () => {
    connectors.injectedConnect.instance.activate().catch((err) => {
      console.error(err);
    });
  };

  const connectWalletConnect = () => {
    connectors.walletConnect.instance.activate().catch((err) => {
      console.error(err);
    });
  };

  return (
    <StyleWrapper>
      <WalletBoxWrapper onClick={connectMetamask}>
        <MetaMaskIcon />
        <div className="title">Metamask</div>
      </WalletBoxWrapper>

      <WalletBoxWrapper onClick={connectImToken}>
        <ImTokenIcon />
        <div className="title">ImToken</div>
      </WalletBoxWrapper>

      <WalletBoxWrapper onClick={connectSafePal}>
        <SafePalIcon />
        <div className="title">SafePal</div>
      </WalletBoxWrapper>

      <WalletBoxWrapper onClick={connectWalletConnect}>
        <WalletConnectIcon />
        <div className="title">WalletConnect</div>
      </WalletBoxWrapper>
    </StyleWrapper>
  );
};

type ConnectorModalProps = {
  connectBtnQuerySelector: string;
  popoverVisible: boolean;
  setPopoverVisible: (v: boolean) => void;
};
export const ConnectorModal: React.FC<ConnectorModalProps> = ({
  connectBtnQuerySelector,
  popoverVisible,
  setPopoverVisible,
}) => {
  const closeSelectMenu = () => {
    setPopoverVisible(false);
  };

  useEffect(() => {
    document.addEventListener("click", (e) => {
      const target = document.querySelector(connectBtnQuerySelector);
      if (!(e.target && e.target instanceof Element && (e.target === target || target?.contains(e.target)))) {
        closeSelectMenu();
      }
    });
  });

  return (
    <ConfirmModal
      title={"Choose Wallet"}
      visible={popoverVisible}
      onOk={closeSelectMenu}
      onCancel={closeSelectMenu}
      footer={null}
      width={400}
    >
      <SelectMenu handleClick={closeSelectMenu}></SelectMenu>
    </ConfirmModal>
  );
};
