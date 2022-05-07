import React from "react";
import { ReactComponent as Hamburger } from "../../asserts/hamburger.svg";

import styled from "styled-components";
const StyledPage = styled.div`
  position: fixed;
  bottom: 0;
  height: 48px;
  width: 100%;
  padding: 16px 8px;
  display: flex;
  justify-content: end;
  align-items: center;
  background: white;
  margin-top: 24px;
  @media (min-width: 600px) {
    display: none;
  }
`;

const PageFooter: React.FC = () => {
  return (
    <StyledPage>
      <Hamburger></Hamburger>
    </StyledPage>
  );
};

export default PageFooter;
