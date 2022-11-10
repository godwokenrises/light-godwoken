import React, { useEffect, useRef, useState } from "react";
import { ReactComponent as Hamburger } from "../../assets/hamburger.svg";

import styled from "styled-components";
import { Popover } from "antd";
import { PopoverMenu } from "../PopoverMenu";
import { VersionSelect } from "../VersionSelect";

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
  const footerRef = useRef<HTMLDivElement>() as React.MutableRefObject<HTMLInputElement>;
  const [popoverVisible, setPopoverVisible] = useState(false);

  useEffect(() => {
    document.addEventListener("click", (e) => {
      const target = document.querySelector(".hamburger-menu-bottom");
      if (!(e.target && e.target instanceof Element && (e.target === target || target?.contains(e.target)))) {
        setPopoverVisible(false);
      }
    });
  });

  return (
    <StyledPage ref={footerRef}>
      <VersionSelect placement="topRight" />
      <Popover
        autoAdjustOverflow
        destroyTooltipOnHide
        trigger="focus"
        placement="topRight"
        overlayClassName="popover-menu"
        visible={popoverVisible}
        getPopupContainer={() => footerRef.current}
        content={<PopoverMenu onClick={() => setPopoverVisible(false)} />}
      >
        <Hamburger className="hamburger-menu-bottom" onClick={() => setPopoverVisible(true)} />
      </Popover>
    </StyledPage>
  );
}
