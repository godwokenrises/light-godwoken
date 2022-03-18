import { Typography } from "antd";
import React from "react";
import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import { ClaimSudt } from "../components/ClaimSudt";
import { ConnectButton } from "../components/ConnectButton";
import { VersionSelect } from "../components/VersionSelect";
const StyledPage = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px;
  background: radial-gradient(89.56% 89.56% at 50.04% 10.44%, rgb(60, 58, 75) 0%, rgb(28, 27, 37) 92.56%);
  margin-bottom: 20px;
  color: white;
  .l1-faucet {
    display: flex;
    flex-direction: column;
    padding-top: 20px;
    .ant-typography {
      color: white;
      padding-right: 5px;
    }
    a {
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

const PageHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = () => {
  const params = useParams();
  return (
    <StyledPage>
      <div className="link">
        <Link to={"/" + params.version + "/deposit/"}>Deposit</Link>
        <Link to={"/" + params.version}>Withdrawal</Link>
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
