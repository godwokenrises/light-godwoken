import { BI } from "@ckb-lumos/lumos";
import React, { useState } from "react";
import styled from "styled-components";
import { CKB_EXPLORER_URL } from "../../config";
import { L1TxHistoryInterface } from "../../hooks/useL1TxHistory";
import { MainText, PrimaryText } from "../../style/common";
import { COLOR } from "../../style/variables";
import { getDisplayAmount } from "../../utils/formatTokenAmount";
import { formatToThousands } from "../../utils/numberFormat";

const StyleWrapper = styled.div`
  cursor: pointer;
  width: 100%;
  display: flex;
  padding-bottom: 16px;
  justify-content: space-between;
  & + & {
    border-top: 1px dashed rgba(0, 0, 0, 0.2);
    padding-top: 16px;
  }
  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
  .title {
    padding: 6px 8px;
    border: 1px solid red;
    border-radius: 8px;
    width: fit-content;
    font-size: 12px;
    &.deposit {
      color: #9a2cec;
      border-color: #9a2cec;
    }
    &.withdrawal {
      color: ${COLOR.brand};
      border-color: ${COLOR.brand};
    }
    & + span {
      margin-top: 8px;
    }
  }
  .right,
  .left {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .right {
    text-align: end;
    span + span {
      margin-top: 16px;
    }
  }
`;

export const Item: React.FC<L1TxHistoryInterface> = (prop) => {
  const openTransaction = () => {
    // TODO  change withdrawal to use layer2Config.SCANNER_URL
    window.open(`${CKB_EXPLORER_URL}/transaction/${prop.txHash}`, "_blank");
  };
  return (
    <StyleWrapper onClick={openTransaction}>
      <div className="left">
        <div className={"title " + prop.type}>{prop.type}</div>
        {prop.date && <PrimaryText>{prop.date}</PrimaryText>}
      </div>
      <div className="right">
        <MainText>{formatToThousands(getDisplayAmount(BI.from(prop.capacity)))} CKB</MainText>
        {prop.amount && prop.amount !== "0x0" && (
          <MainText>
            {formatToThousands(getDisplayAmount(BI.from(prop.amount), prop.decimals))} ${prop.symbol}
          </MainText>
        )}
      </div>
    </StyleWrapper>
  );
};
