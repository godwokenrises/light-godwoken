import React from "react";
import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import { ConnectButton } from "../components/ConnectButton";
import { VersionSelect } from "../components/VersionSelect";
import { claim } from "../utils/claimSudt";
const StyledPage = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px;
  background: radial-gradient(89.56% 89.56% at 50.04% 10.44%, rgb(60, 58, 75) 0%, rgb(28, 27, 37) 92.56%);
  margin-bottom: 20px;
  color: white;
  .right-side {
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
  const cliamSudt = () => {
    claim();
  };
  return (
    <StyledPage>
      <div className="link">
        <Link to={"/" + params.version + "/deposit/"}>Deposit</Link>
        <Link to={"/" + params.version}>Withdrawal</Link>
      </div>
      <div className="title">Light Godwoken</div>
      <div className="right-side">
        <ConnectButton />
        <VersionSelect />
        <button onClick={cliamSudt}>cliam</button>
      </div>
    </StyledPage>
  );
};

export default PageHeader;
