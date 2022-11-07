import React, { useEffect, useMemo, useState } from "react";
import { ReactComponent as Logo } from "../../assets/logo.svg";
import { ReactComponent as Hamburger } from "../../assets/hamburger.svg";

import styled from "styled-components";
import { Popover } from "antd";
import { PopoverMenu } from "../PopoverMenu";
import { VersionSelect } from "../VersionSelect";
import { matchPath, useLocation, useNavigate, useParams } from "react-router-dom";

const StyledPage = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 100px;
  min-height: 64px;
  margin-bottom: 24px;
  background: white;
  color: black;
  .logo-container {
    width: 182px;
    flex: 1;
  }
  .link-list {
    flex: 1;
    display: flex;
    justify-content: center;
  }
  .right-side {
    flex: 1;
    display: flex;
    justify-content: end;
    > &:hover {
      cursor: pointer;
    }
  }
  .hamburger-menu {
    cursor: pointer;
  }
  @media (max-width: 1024px) {
    padding: 16px 8px;
    flex-direction: column;

    .logo-container {
      display: flex;
      justify-content: center;
    }
    .link-list {
      margin-top: 12px;
      padding-top: 16px;
      border-top: 1px solid #eee;
    }
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
  @media (max-width: 1024px) {
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

enum HeaderPaths {
  Deposit = "deposit",
  Withdrawal = "withdrawal",
  L1Transfer = "transfer",
}

export default function PageHeader() {
  const location = useLocation();
  const currentPath = useMemo(() => {
    return (
      Object.values(HeaderPaths).find((path) => {
        return matchPath(`/:version/${path}/*`, location.pathname) !== null;
      }) ?? null
    );
  }, [location.pathname]);

  const params = useParams();
  const navigate = useNavigate();
  function toRoute(path: HeaderPaths) {
    navigate(`/${params.version}/${path}`);
  }

  const [popoverVisible, setPopoverVisible] = useState(false);
  useEffect(() => {
    document.addEventListener("click", (e) => {
      const target = document.querySelector(".hamburger-menu");
      if (!(e.target && e.target instanceof Element && (e.target === target || target?.contains(e.target)))) {
        setPopoverVisible(false);
      }
    });
  });

  return (
    <StyledPage>
      <div className="logo-container">
        <Logo height={27} />
      </div>
      <div className="link-list">
        <Link
          className={currentPath === HeaderPaths.Deposit ? "active" : ""}
          onClick={() => toRoute(HeaderPaths.Deposit)}
        >
          Deposit
        </Link>
        <Link
          className={currentPath === HeaderPaths.Withdrawal ? "active" : ""}
          onClick={() => toRoute(HeaderPaths.Withdrawal)}
        >
          Withdrawal
        </Link>
        <Link
          className={currentPath === HeaderPaths.L1Transfer ? "active" : ""}
          onClick={() => toRoute(HeaderPaths.L1Transfer)}
        >
          L1 Transfer
        </Link>
      </div>
      <div className="right-side">
        <VersionSelect />
        <Popover
          trigger="hover"
          placement="bottomLeft"
          overlayClassName="popover-menu"
          content={() => <PopoverMenu handleClick={() => setPopoverVisible(false)} />}
        >
          <Hamburger className="hamburger-menu" />
        </Popover>
      </div>
    </StyledPage>
  );
}
