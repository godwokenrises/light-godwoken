import { Tooltip } from "antd";
import { Icon } from "@ricons/utils";
import { RadioButtonCheckedRound, RadioButtonUncheckedRound } from "@ricons/material";
import { ReactComponent as CKBIcon } from "../../assets/ckb.svg";
import { DotBitCoinType } from "../../hooks/useDotBit";
import { COLOR } from "../../style/variables";
import { truncateCkbAddress, truncateEthAddress } from "../../utils/stringFormat";
import styled from "styled-components";
import classes from "classnames";

const StyleWrapper = styled.div`
  display: flex;
  padding: 4px 10px;
  word-wrap: anywhere;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;

  .radio {
    margin-left: 6px;
    flex: none;
    display: flex;
    font-size: 26px;
    align-items: center;
    color: #b9b9b9;

    &.selected {
      color: ${COLOR.brand};
    }
  }
  .content {
    flex: auto;

    .content-address {
      display: inline-flex;
      align-items: center;
      color: ${COLOR.secondary};
    }
    .content-logo {
      margin-right: 4px;
      width: 16px;
      height: 16px;
      user-select: none;
    }
  }

  &:not(:first-child) {
    border-top: 1px solid #dedede;
  }
  &:hover {
    background-color: #f2f2f2;
  }
`;

export interface DotBitOptionProps {
  data: DotBitL1AddressData;
  selected: boolean;
  onClick?: () => void;
}

export interface DotBitL1AddressData {
  coinType: string;
  address: string;
  value: string;
}

export default function DotBitL1AddressOption(props: DotBitOptionProps) {
  return (
    <StyleWrapper onClick={props.onClick}>
      <div className="content">
        <Tooltip title={props.data.address} placement="topLeft">
          <div className="content-address">
            {props.data.coinType === DotBitCoinType.Eth && (
              <>
                <img
                  className="content-logo"
                  src="https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=002"
                  alt="ETH"
                />
                <div>{truncateEthAddress(props.data.address)}</div>
              </>
            )}
            {props.data.coinType === DotBitCoinType.Ckb && (
              <>
                <CKBIcon className="content-logo" />
                <div>{truncateCkbAddress(props.data.address)}</div>
              </>
            )}
          </div>
        </Tooltip>
        <div>
          {props.data.coinType === DotBitCoinType.Eth && "Transfer to L1 Wallet Address"}
          {props.data.coinType === DotBitCoinType.Ckb && "Transfer to Address"}
        </div>
      </div>
      <div className={classes("radio", props.selected ? "selected" : "")}>
        <Icon>{props.selected ? <RadioButtonCheckedRound /> : <RadioButtonUncheckedRound />}</Icon>
      </div>
    </StyleWrapper>
  );
}
