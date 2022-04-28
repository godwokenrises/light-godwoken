import React, { useState } from "react";
import { ReactComponent as Logo } from "../../asserts/logo.svg";
import { ReactComponent as Hamburger } from "../../asserts/hamburger.svg";

import styled from "styled-components";
import { SHOW_CLAIM_BUTTON } from "../../config";
import { ClaimSudt } from "../ClaimSudt";
import { ConnectButton } from "../ConnectButton";
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
  const changeViewToDeposit = () => {
    setActive("deposit");
    onViewChange && onViewChange("deposit");
  };
  const changeViewToWithdrawal = () => {
    setActive("withdrawal");
    onViewChange && onViewChange("withdrawal");
  };
  console.log(SHOW_CLAIM_BUTTON);
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
        <Hamburger></Hamburger>
        {/* {SHOW_CLAIM_BUTTON && <ClaimSudt />}
        {SHOW_CLAIM_BUTTON && (
          <a href="https://faucet.nervos.org/" target="_blank" rel="noreferrer">
            CKB Testnet Faucet
          </a>
        )} */}
      </div>
    </StyledPage>
  );
};

export default PageHeader;
