import React, { useEffect, useState } from "react";
import { ReactComponent as Logo } from "../../asserts/logo.svg";
import { ReactComponent as Hamburger } from "../../asserts/hamburger.svg";

import styled from "styled-components";
import { Popover } from "antd";
import { PopoverMenu } from "../PopoverMenu";
import { VersionSelect } from "../VersionSelect";
const StyledPage = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 100px;
  height: 64px;
  margin-bottom: 24px;
  background: white;
  color: black;
  .link-list {
    display: flex;
  }
  .right-side {
    display: flex;
    width: 130px;
    justify-content: end;
    > &:hover {
      cursor: pointer;
    }
  }
  .hamburger-menu {
    cursor: pointer;
  }
  @media (max-width: 600px) {
    padding: 16px 8px;
    .right-side {
      display: none;
    }
  }
`;
const Link = styled.span`
  height: 32px;
  line-height: 32px;
  width: 120px;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  color: black;
  border-radius: 8px;
  @media (max-width: 600px) {
    width: 100px;
    .right-side {
      display: none;
    }
  }
  &.active {
    background: #18efb1;
  }
  &:hover {
    cursor: pointer;
  }
`;

interface Props {
  onViewChange?: (view: string) => void;
}
const PageHeader: React.FC<Props> = ({ onViewChange }) => {
  const [active, setActive] = useState("deposit");
  const [popoverVisible, setPopoverVisible] = useState(false);
  const changeViewToDeposit = () => {
    setActive("deposit");
    onViewChange && onViewChange("deposit");
  };
  const changeViewToWithdrawal = () => {
    setActive("withdrawal");
    onViewChange && onViewChange("withdrawal");
  };
  const openPopoverMenu = () => {
    setPopoverVisible(true);
  };

  const closePopoverMenu = () => {
    setPopoverVisible(false);
  };

  useEffect(() => {
    document.addEventListener("click", (e) => {
      const target = document.querySelector(".hamburger-menu");
      if (!(e.target && e.target instanceof Element && (e.target === target || target?.contains(e.target)))) {
        closePopoverMenu();
      }
    });
  });

  return (
    <StyledPage>
      <Logo height={27}></Logo>
      <div className="link-list">
        <Link onClick={changeViewToDeposit} className={active === "deposit" ? "active" : ""}>
          Deposit
        </Link>
        <Link onClick={changeViewToWithdrawal} className={active === "withdrawal" ? "active" : ""}>
          Withdrawal
        </Link>
      </div>
      <div className="right-side">
        <VersionSelect></VersionSelect>
        <Popover
          content={() => <PopoverMenu handleClick={closePopoverMenu}></PopoverMenu>}
          trigger="click"
          overlayClassName="popover-menu"
          visible={popoverVisible}
          placement="bottomLeft"
        >
          <Hamburger className="hamburger-menu" onClick={openPopoverMenu}></Hamburger>
        </Popover>
      </div>
    </StyledPage>
  );
};

export default PageHeader;
