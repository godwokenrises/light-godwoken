import React, { useState } from "react";
import styled from "styled-components";
import { SHOW_CLAIM_BUTTON } from "../../config";
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
    color: white;
    a {
      color: white;
      text-decoration: none;
      margin-right: 10px;
    }
    > div {
      margin-right: 20px;
      &:hover {
        cursor: pointer;
      }
    }
    .active {
      color: rgb(255, 67, 66);
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
      <div className="link">
        <div onClick={changeViewToDeposit} className={active === "deposit" ? "active" : ""}>
          Deposit
        </div>
        <div onClick={changeViewToWithdrawal} className={active === "withdrawal" ? "active" : ""}>
          Withdrawal
        </div>
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
