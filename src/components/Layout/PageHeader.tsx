import React, { useEffect, useMemo, useState } from 'react';
import { ReactComponent as Logo } from "../../assets/logo.svg";
import { ReactComponent as Hamburger } from "../../assets/hamburger.svg";

import styled from "styled-components";
import { Popover } from "antd";
import { PopoverMenu } from "../PopoverMenu";
import { VersionSelect } from "../VersionSelect";
import { isMainnet } from "../../light-godwoken/env";
import { matchPath, useLocation, useNavigate, useParams } from 'react-router-dom';
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
  .logo-container {
    width: 182px;
  }
  .link-list {
    display: flex;
  }
  .right-side {
    display: flex;
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

export default function PageHeader() {
  const location = useLocation();
  const isDeposit = useMemo(() => {
    return matchPath("/:version/deposit/*", location.pathname) !== null;
  }, [location.pathname]);
  const isWithdrawal = useMemo(() => {
    return matchPath("/:version/withdrawal/*", location.pathname) !== null;
  }, [location.pathname]);

  const params = useParams();
  const navigate = useNavigate();
  function changeViewToDeposit() {
    navigate(`/${params.version}/deposit`);
  }
  function changeViewToWithdrawal() {
    navigate(`/${params.version}/withdrawal`);
  }

  const [popoverVisible, setPopoverVisible] = useState(false);
  function openPopoverMenu() {
    setPopoverVisible(true);
  }
  function closePopoverMenu() {
    setPopoverVisible(false);
  }

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
      <div className="logo-container">
        <Logo height={27}></Logo>
      </div>
      <div className="link-list">
        <Link onClick={changeViewToDeposit} className={isDeposit ? "active" : ""}>
          Deposit
        </Link>
        <Link onClick={changeViewToWithdrawal} className={isWithdrawal ? "active" : ""}>
          Withdrawal
        </Link>
      </div>
      <div className="right-side">
        <VersionSelect></VersionSelect>
        {!isMainnet && (
          <Popover
            content={() => <PopoverMenu handleClick={closePopoverMenu}></PopoverMenu>}
            trigger="click"
            overlayClassName="popover-menu"
            visible={popoverVisible}
            placement="bottomLeft"
          >
            <Hamburger className="hamburger-menu" onClick={openPopoverMenu}></Hamburger>
          </Popover>
        )}
      </div>
    </StyledPage>
  );
}
