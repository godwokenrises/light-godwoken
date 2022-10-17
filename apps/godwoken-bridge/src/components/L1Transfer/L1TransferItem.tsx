import styled from "styled-components";
import React, { useMemo } from "react";
import { BI } from "@ckb-lumos/lumos";
import { L1TxHistoryInterface } from "../../hooks/useL1TxHistory";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { getDisplayAmount } from "../../utils/formatTokenAmount";
import { ReactComponent as CKBIcon } from "../../assets/ckb.svg";
import { CheckCircleOutlined, ExclamationCircleOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { ArrowRightAltTwotone } from "@ricons/material";
import { Icon } from "@ricons/utils";
import { MainText } from "../../style/common";
import { COLOR } from "../../style/variables";
import { Tooltip } from "antd";

const L1TransferItemStyleWrapper = styled.div`
  padding: 16px;
  border-radius: 12px;
  background: #f3f3f3;

  & + & {
    margin-top: 16px;
  }

  .main-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    font-weight: 400;
    line-height: 1.5;
    font-size: 14px;
    flex-wrap: wrap;
    &:hover {
      cursor: pointer;
    }
  }
  .amount {
    display: flex;
    flex-direction: column;
    justify-content: center;
    .ckb-amount,
    .sudt-amount {
      img,
      svg {
        width: 22px;
        height: 22px;
        margin-right: 5px;
      }
    }
    .ckb-amount {
      display: flex;
      align-items: center;

      .ckb-icon {
        display: flex;
        align-items: center;
      }
    }
    .sudt-amount {
      display: flex;
      align-items: center;
    }
    .sudt-amount + .ckb-amount {
      margin-top: 10px;
    }
    .address {
      display: flex;
      align-items: center;
      margin-top: 10px;

      .address-icon {
        display: inline-flex;
        margin-right: 5px;
        width: 22px;
        height: 22px;
        font-size: 24px;
        align-items: center;
        justify-content: center;
      }
    }
  }
  .right-side {
    height: 40px;
    display: flex;
    align-self: center;
    align-items: center;
    justify-content: center;
  }
`;

export interface L1TransferItemProps extends L1TxHistoryInterface {}

export default function L1TransferItem(props: L1TransferItemProps) {
  const lightGodwoken = useLightGodwoken();

  const { capacity, amount, token, recipient, status } = props;
  const transferredSudt = useMemo(() => BI.from(amount).gt(0) && token !== void 0, [amount, token]);
  const ckbAmount = useMemo(() => `${getDisplayAmount(BI.from(capacity), 8)} CKB`, [capacity]);
  const sudtAmount = useMemo(() => {
    if (!transferredSudt) return "";
    return `${getDisplayAmount(BI.from(amount), token!.decimals)} ${token!.symbol}`;
  }, [transferredSudt, amount, token]);
  const shortenRecipient = useMemo(() => (recipient ? truncateMiddle(recipient, 11, 11) : ""), [recipient]);

  function truncateMiddle(str: string, first = 40, last = 6) {
    return str.substring(0, first) + "..." + str.substring(str.length - last);
  }
  function toExplorer() {
    if (!lightGodwoken) return;
    const config = lightGodwoken.getConfig();
    window.open(`${config.layer1Config.SCANNER_URL}/transaction/${props.txHash}`, "_blank");
  }

  return (
    <L1TransferItemStyleWrapper>
      <div className="main-row" onClick={toExplorer}>
        <div className="amount">
          {transferredSudt && (
            <div className="sudt-amount">
              {token?.tokenURI ? <img src={token?.tokenURI} alt="" /> : ""}
              <MainText>{sudtAmount}</MainText>
            </div>
          )}
          {!transferredSudt && (
            <div className="ckb-amount">
              <div className="ckb-icon">
                <CKBIcon />
              </div>
              <MainText>{ckbAmount}</MainText>
            </div>
          )}
          <div className="address">
            <div className="address-icon">
              <Icon>
                <ArrowRightAltTwotone />
              </Icon>
            </div>
            <MainText>{shortenRecipient}</MainText>
          </div>
        </div>
        <div className="right-side">
          {status === "pending" && (
            <Tooltip title="Transaction committing">
              <QuestionCircleOutlined style={{ color: "#00CC9B", height: "21px", lineHeight: "21px" }} />
            </Tooltip>
          )}
          {status === "success" && (
            <Tooltip title={status}>
              <CheckCircleOutlined style={{ color: "#00CC9B", height: "21px", lineHeight: "21px" }} />
            </Tooltip>
          )}
          {status === "rejected" && (
            <Tooltip title="Transaction has been rejected">
              <ExclamationCircleOutlined style={{ color: COLOR.error, height: "21px", lineHeight: "21px" }} />
            </Tooltip>
          )}
        </div>
      </div>
    </L1TransferItemStyleWrapper>
  );
}
