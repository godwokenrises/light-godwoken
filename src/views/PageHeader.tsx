import React from "react";
import styled from "styled-components";
import { ConnectButton } from "../components/ConnectButton";

const StyledPage = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px;
  background: radial-gradient(89.56% 89.56% at 50.04% 10.44%, rgb(60, 58, 75) 0%, rgb(28, 27, 37) 92.56%);
  margin-bottom: 20px;
  color: white;
  .address:hover {
    cursor: pointer;
  }
`;

const PageHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = () => {
  return (
    <StyledPage>
      <div className="icon"></div>
      <div className="title">Withdrawal</div>
      <div className="address">
        <ConnectButton />
      </div>
    </StyledPage>
  );
};

export default PageHeader;
