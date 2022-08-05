import React from "react";
import styled from "styled-components";

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  min-height: calc(100vh);
  background: linear-gradient(111.44deg, #dcf2ed 0%, #d3d9ec 100%);
`;

const Page: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => {
  return <StyledPage {...props}>{children}</StyledPage>;
};

export default Page;
