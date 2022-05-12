import React, { useState } from "react";
import { ReactComponent as Hamburger } from "../../asserts/hamburger.svg";

import styled from "styled-components";
import { Popover } from "antd";
import { PopoverMenu } from "../PopoverMenu";
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
  const [popoverVisible, setPopoverVisible] = useState(false);
  const openPopoverMenu = () => {
    setPopoverVisible(true);
  };

  const closePopoverMenu = () => {
    setPopoverVisible(false);
  };
  return (
    <StyledPage>
      <Popover
        content={() => <PopoverMenu handleClick={closePopoverMenu}></PopoverMenu>}
        trigger="click"
        placement="topLeft"
        overlayClassName="popover-menu"
        visible={popoverVisible}
      >
        <Hamburger onClick={openPopoverMenu}></Hamburger>
      </Popover>
    </StyledPage>
  );
};

export default PageFooter;
