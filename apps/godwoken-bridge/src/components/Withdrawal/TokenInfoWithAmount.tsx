import React from "react";
import { BI, BIish } from "@ckb-lumos/bi";
import { ProxyERC20 } from "light-godwoken";
import QuestionCircleOutlined from "@ant-design/icons/lib/icons/QuestionCircleOutlined";
import { MainText } from "../../style/common";
import { getDisplayAmount } from "../../utils/formatTokenAmount";

export type TokenInfoWithAmountProps = ProxyERC20 & { amount: BIish };
type TokenInfoWithAmountType = React.FC<TokenInfoWithAmountProps>;

export const TokenInfoWithAmount: TokenInfoWithAmountType = (props: TokenInfoWithAmountProps) => {
  if (!props.amount || BI.from(props.amount).eq(0)) {
    return null;
  }

  return (
    <div style={{ marginTop: 10 }}>
      {props.tokenURI ? (
        <img src={props.tokenURI} alt="" />
      ) : (
        <QuestionCircleOutlined style={{ width: 24, height: 24, marginRight: 10 }} />
      )}
      <MainText>{`${getDisplayAmount(BI.from(props.amount), props.decimals)} ${props.symbol}`}</MainText>
    </div>
  );
};
