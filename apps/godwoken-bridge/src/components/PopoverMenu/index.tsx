import React, { ReactNode } from "react";
import styled from "styled-components";
import { COLOR } from "../../style/variables";
import { ClaimSudt } from "../ClaimSudt";
import { isMainnet } from "../../utils/environment";
import { OpenInNewRound } from "@ricons/material";
import { Icon } from "@ricons/utils";

const PopoverMenuStyleWrapper = styled.div`
  display: flex;
  flex-direction: column;

  > a,
  > div {
    margin: 4px 0;
    padding: 0 10px;
    min-width: 220px;
    height: 33px;
    line-height: 33px;
    color: ${COLOR.secondary};
    text-decoration: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;

    &:hover {
      background: #f3f3f3;
      color: ${COLOR.primary};
    }
    &:active {
      background: #ececec;
    }
  }
`;

const PopoverMenuLinkStyleWrapper = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;

  > .icon {
    display: inline-flex;
    align-items: center;
    margin-left: 4px;
    color: ${COLOR.label};
  }
`;

export interface PopoverMenuProps {
  onClick?: () => void;
}

export function PopoverMenu({ onClick }: PopoverMenuProps) {
  return (
    <PopoverMenuStyleWrapper>
      {!isMainnet && (
        <div className="claim-sudt-container" onClick={onClick}>
          <ClaimSudt />
        </div>
      )}
      <PopoverMenuLink href="https://faucet.nervos.org" onClick={onClick}>
        Claim CKB Faucet on L1
      </PopoverMenuLink>
      <PopoverMenuLink href="https://docs.godwoken.io" onClick={onClick}>
        Godwoken Docs
      </PopoverMenuLink>
      <PopoverMenuLink href="https://github.com/godwokenrises/light-godwoken" onClick={onClick}>
        GitHub
      </PopoverMenuLink>
    </PopoverMenuStyleWrapper>
  );
}

interface PopoverMenuLinkProps {
  href: string;
  children: ReactNode;
  onClick?: () => void;
}

export function PopoverMenuLink(props: PopoverMenuLinkProps) {
  return (
    <PopoverMenuLinkStyleWrapper target="_blank" rel="noreferrer" href={props.href} onClick={props.onClick}>
      {props.children}
      <div className="icon">
        <Icon>
          <OpenInNewRound />
        </Icon>
      </div>
    </PopoverMenuLinkStyleWrapper>
  );
}
