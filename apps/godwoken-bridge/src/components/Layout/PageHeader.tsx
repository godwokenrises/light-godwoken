import styled from "styled-components";
import React, { PropsWithChildren, useMemo } from "react";
import { Popover } from "antd";
import { Link } from "react-router-dom";
import { PathPattern } from "react-router";
import { Icon } from "@ricons/utils";
import { OpenInNewRound } from "@ricons/material";
import { PopoverMenu } from "../PopoverMenu";
import { VersionSelect } from "../VersionSelect";
import { ShowOnPhaseOut } from "../PhaseOut/ShowOnPhaseOut";
import { matchPath, useLocation, useParams } from "react-router-dom";

import { ReactComponent as Logo } from "../../assets/logo.svg";
import { ReactComponent as Hamburger } from "../../assets/hamburger.svg";
import { isMainnet } from "../../utils/environment";
import { COLOR } from "../../style/variables";

const StyledPage = styled.div`
  margin-bottom: 24px;
  width: 100%;
  display: flex;
  justify-content: center;
  background-color: white;
  color: black;

  .wrapper {
    padding: 0 100px;
    min-height: 64px;
    width: 100%;
    display: flex;
    position: relative;
    align-items: center;
    justify-content: space-between;
  }

  .logo-container {
    flex: none;
  }

  .link-list {
    display: flex;
    position: absolute;
    height: 100%;
    left: 50%;
    top: 0;
    transform: translate(-50%, 0);
  }

  .right-side {
    flex: none;
    display: flex;
    justify-content: end;

    > &:hover {
      cursor: pointer;
    }
  }

  .hamburger-menu {
    cursor: pointer;
  }

  .vertical-divider {
    padding: 0 12px;
    display: flex;
    align-items: center;

    .divider {
      width: 1px;
      height: 40%;
      background-color: #e1e1e1;
    }
  }

  @media (max-width: 1024px) {
    .wrapper {
      padding: 0;
      flex-direction: column;
    }

    .logo-container {
      padding: 20px 0 12px 0;
      flex: none;
      display: flex;
      justify-content: center;
    }

    .link-list {
      width: 100%;
      height: initial;
      flex: none;
      overflow-x: auto;
      overflow-y: hidden;
      white-space: nowrap;
      position: static;
      transform: none;

      > a {
        display: inline-block;

        :first-child {
          margin-left: auto;
        }

        :last-child {
          margin-right: auto;
        }
      }
    }

    .right-side {
      display: none;
    }
  }
`;
const NavLink = styled.span`
  padding: 16px 8px;
  flex: 0 0 auto;
  position: relative;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  min-width: 96px;
  height: 100%;

  .text {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    text-align: center;
    font-size: 14px;
    color: ${COLOR.label};
    opacity: 0.7;
  }

  .decorator {
    bottom: 0;
    left: 50%;
    width: 40%;
    height: 4px;
    position: absolute;
    transform: translate(-50%, 0);
  }

  .icon {
    display: inline-flex;
    align-items: center;
    margin-left: 3px;
  }

  &:hover {
    cursor: pointer;
    .text {
      color: #6fa26f;
    }
  }

  &.active {
    .text {
      opacity: 1;
      font-weight: bold;
      color: ${COLOR.primary};
    }

    .decorator {
      background-color: #6fa26f;
    }
  }
`;

export default function PageHeader() {
  const params = useParams();

  return (
    <StyledPage>
      <div className="wrapper">
        <div className="logo-container">
          <Logo height={27} />
        </div>
        <div className="link-list">
          <ShowOnPhaseOut
            not={
              <HeaderTab to={`/${params.version}/deposit`} pattern="/:version/deposit/*">
                Deposit
              </HeaderTab>
            }
          />
          <HeaderTab to={`/${params.version}/withdrawal`} pattern="/:version/withdrawal/*">
            Withdrawal
          </HeaderTab>
          <HeaderTab to={`/${params.version}/transfer`} pattern="/:version/transfer/*">
            L1 Transfer
          </HeaderTab>
          {!isMainnet && (
            <div className="vertical-divider">
              <div className="divider" />
            </div>
          )}
          {!isMainnet && <HeaderLink href="https://testnet.nft-bridge.godwoken.io">NFT Bridge (Beta)</HeaderLink>}
        </div>
        <div className="right-side">
          <VersionSelect />
          <Popover
            trigger="hover"
            placement="bottomLeft"
            overlayClassName="popover-menu"
            content={() => <PopoverMenu />}
          >
            <Hamburger className="hamburger-menu" />
          </Popover>
        </div>
      </div>
    </StyledPage>
  );
}

export interface HeaderTabProps<TPath extends string = string> {
  to: string;
  pattern: TPath | PathPattern<TPath>;
}
export function HeaderTab(props: PropsWithChildren<HeaderTabProps>) {
  const location = useLocation();
  const isActive = useMemo(
    () => matchPath(props.pattern, location.pathname) !== null,
    [props.pattern, location.pathname],
  );

  return (
    <Link to={props.to}>
      <NavLink className={isActive ? "active" : void 0}>
        <div className="text">{props.children}</div>
        <div className="decorator" />
      </NavLink>
    </Link>
  );
}

export interface HeaderLinkProps {
  href: string;
}
export function HeaderLink(props: PropsWithChildren<HeaderLinkProps>) {
  return (
    <a href={props.href} target="_blank" rel="noreferrer">
      <NavLink>
        <div className="text">
          {props.children}
          <div className="icon">
            <Icon>
              <OpenInNewRound />
            </Icon>
          </div>
        </div>
        <div className="decorator" />
      </NavLink>
    </a>
  );
}
