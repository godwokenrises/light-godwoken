import React from "react";
import styled from "styled-components";
import { ClaimSudt } from "../ClaimSudt";
import { ConnectButton } from "../ConnectButton";
import { VersionSelect } from "../VersionSelect";
const StyledPage = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px;
  background: radial-gradient(89.56% 89.56% at 50.04% 10.44%, rgb(60, 58, 75) 0%, rgb(28, 27, 37) 92.56%);
  margin-bottom: 20px;
  color: white;
  .link {
    display: flex;
    color: #1890ff;
    > div {
      margin-right: 10px;
      &:hover {
        cursor: pointer;
      }
    }
  }
  .right-side {
    width: 410px;
    display: flex;
    justify-content: end;
    > &:hover {
      cursor: pointer;
    }
  }
  a + a {
    padding-left: 10px;
  }
`;
interface Props {
  onViewChange?: (view: string) => void;
}
const PageHeader: React.FC<Props> = ({ onViewChange }) => {
  const changeViewToDeposit = () => {
    onViewChange && onViewChange("deposit");
  };
  const changeViewToWithDrawal = () => {
    onViewChange && onViewChange("withdrawal");
  };
  return (
    <StyledPage>
      <div className="link">
        <div onClick={changeViewToDeposit}>Deposit</div>
        <div onClick={changeViewToWithDrawal}>Withdrawal</div>
        <ClaimSudt />
        <a href="https://faucet.nervos.org/" target="_blank" rel="noreferrer">
          CKB Testnet Faucet
        </a>
      </div>
      <div className="title">Light Godwoken</div>
      <div className="right-side">
        <ConnectButton />
        <VersionSelect />
      </div>
    </StyledPage>
  );
};

export default PageHeader;
