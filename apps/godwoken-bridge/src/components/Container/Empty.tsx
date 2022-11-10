import styled from "styled-components";
import { PropsWithChildren } from "react";
import { Icon } from "@ricons/utils";
import { InboxFilled } from "@ricons/material";

const EmptyStyleWrapper = styled.div`
  padding-top: 16px;
  padding-bottom: 4px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 70px;
    height: 70px;
    font-size: 40px;
    border-radius: 70px;
    color: #548154;
    background-color: #f3f3f3;
  }

  .text {
    color: #666666;
    margin-top: 6px;
    user-select: none;
  }
`;

export function Empty(props: PropsWithChildren<{}>) {
  return (
    <EmptyStyleWrapper>
      <div className="icon">
        <Icon>
          <InboxFilled />
        </Icon>
      </div>
      {props.children && <div className="text">{props.children}</div>}
    </EmptyStyleWrapper>
  );
}
