import React, { useEffect } from "react";
import styled from "styled-components";
import { COLOR } from "../../style/variables";
import { SecondeButton } from "../../style/common";
import { URI_AVAILABLE } from "@web3-react/walletconnect";
import { Popover } from "antd";
import { connectors } from "./connectors";

const StyleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  > a,
  > button {
    color: ${COLOR.primary};
    text-decoration: none;
    cursor: pointer;
    height: 33px;
    padding: 0 10px;
    border-radius: 8px;
    margin: 4px 0px;
    text-align: center;
    line-height: 33px;
    font-size: 14px;
    font-weight: bold;
    &:hover {
      background: rgba(0, 0, 0, 0.1);
      color: ${COLOR.primary};
    }
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
      <SecondeButton onClick={connectMetamask}>Metamask</SecondeButton>
      <SecondeButton onClick={connectImToken}>ImToken</SecondeButton>
      <SecondeButton onClick={connectSafePal}>SafePal</SecondeButton>
      <SecondeButton onClick={connectWalletConnect}>WalletConnect</SecondeButton>
    </StyleWrapper>
  );
};

type ConnectorPopoverProps = {
  connectBtnQuerySelector: string;
  popoverVisible: boolean;
  setPopoverVisible: (v: boolean) => void;
};
export const ConnectorPopover: React.FC<ConnectorPopoverProps> = ({
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
    <Popover
      content={() => <SelectMenu handleClick={closeSelectMenu}></SelectMenu>}
      trigger="click"
      overlayClassName="popover-menu"
      visible={popoverVisible}
      placement="top"
    ></Popover>
  );
};
