import React, { useEffect, useState } from "react";
import { ReactComponent as Hamburger } from "../../assets/hamburger.svg";

import styled from "styled-components";
import { Popover } from "antd";
import { PopoverMenu } from "../PopoverMenu";
import { VersionSelect } from "../VersionSelect";
import { isMainnet } from "../../utils/environment";
const StyledPage = styled.div`
  position: fixed;
  bottom: 0;
  height: 60px;
  width: 100%;
  padding: 8px 8px 16px 8px;
  display: flex;
  justify-content: end;
  align-items: center;
  background: white;
  margin-top: 24px;
  @media (min-width: 1024px) {
    display: none;
  }
`;

export default function PageFooter() {
  const [popoverVisible, setPopoverVisible] = useState(false);

  useEffect(() => {
    document.addEventListener("click", (e) => {
      const target = document.querySelector(".hamburger-menu-bottom");
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
      <VersionSelect />
      {!isMainnet && (
        <Popover
          trigger="click"
          placement="bottomLeft"
          overlayClassName="popover-menu"
          visible={popoverVisible}
          content={() => <PopoverMenu handleClick={closePopoverMenu} />}
        >
          <Hamburger className="hamburger-menu-bottom" onClick={openPopoverMenu} />
        </Popover>
      )}
    </StyledPage>
  );
}
