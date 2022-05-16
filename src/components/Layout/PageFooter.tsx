import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    document.addEventListener("click", (e) => {
      const target = document.querySelector(".hamburger-menu-bottom");
      console.log(target);
      console.log(e.target);
      e.target instanceof Element && console.log(target?.contains(e.target));
      if (!(e.target && e.target instanceof Element && (e.target === target || target?.contains(e.target)))) {
        closePopoverMenu();
      }
    });
  });

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
        overlayClassName="popover-menu"
        visible={popoverVisible}
        placement="bottomLeft"
      >
        <Hamburger className="hamburger-menu-bottom" onClick={openPopoverMenu}></Hamburger>
      </Popover>
    </StyledPage>
  );
};

export default PageFooter;
