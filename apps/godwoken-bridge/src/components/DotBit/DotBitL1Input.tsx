import styled from "styled-components";
import React, { useEffect, useMemo } from "react";
import { Tooltip } from "antd";
import { BitIndexerErrorCode } from "dotbit/lib";
import { COLOR } from "../../style/variables";
import { Placeholder } from "../Placeholder";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { DotBitCoinType, useDotBitForwardAddresses } from "../../hooks/useDotBit";
import DotBitL1AddressOption, { DotBitL1AddressData } from "./DotBitL1AddressOption";
import GeneralInputPanel, { GeneralInputPanelProps } from "../Input/GeneralInputPanel";

const StyleWrapper = styled.div`
  > .title {
    margin-top: 12px;
  }

  .list {
    margin-top: 8px;
    padding: 6px 0;
    border: 1px solid #dedede;
    background-color: #ffffff;
    border-radius: 8px;
  }
  .error {
    padding: 0 8px;
    font-size: 13px;
    color: ${COLOR.label};
    text-align: center;
  }
  .error-button {
    cursor: pointer;

    &:hover {
      color: #1890ff;
    }
  }
  .alias-icon {
    width: 14px;
    height: 14px;
  }
`;

const AppendInputImg = styled.img`
  box-sizing: content-box;
  padding: 0 10px;
  width: 14px;
  height: 14px;
`;

export interface DotBitL1InputProps extends GeneralInputPanelProps {
  queryKey?: string;
  selected?: DotBitL1AddressData;
  onSelected?: (row?: DotBitL1AddressData) => void;
}

export default function DotBitL1Input(props: DotBitL1InputProps) {
  const lightGodwoken = useLightGodwoken();
  const query = useDotBitForwardAddresses({
    queryKey: props.queryKey ?? "ckb",
    alias: props.value,
  });

  const addresses: DotBitL1AddressData[] = useMemo(() => {
    if (!lightGodwoken || !query.addresses?.length) {
      return [];
    }

    return query.addresses.map((row) => ({
      coinType: row.coin_type,
      address: row.value,
      label: row.label?.length ? row.label : void 0,
      value: convertToAvailableAddress(row.coin_type, row.value),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightGodwoken, query.addresses]);

  function convertToAvailableAddress(coinType: string, address: string) {
    if (coinType === DotBitCoinType.Eth) {
      return lightGodwoken!.provider.generateL1Address(address);
    } else {
      return address;
    }
  }

  useEffect(() => {
    if (!query.addresses || !query.addresses.length) {
      props.onSelected?.(void 0);
    }
  }, [query.addresses, props]);

  function onSelectOption(row: DotBitL1AddressData) {
    props.onSelected?.(row.value !== props.selected?.value ? row : void 0);
  }

  return (
    <GeneralInputPanel
      {...props}
      value={props.value}
      onUserInput={props.onUserInput}
      appendLabel={query.isLoading && <Placeholder />}
      appendInput={
        !query.isLoading &&
        query.isValidAlias && (
          <Tooltip
            title="Searching .bit account for addresses, click to check the details of this .bit account"
            placement="topRight"
          >
            <a href={`https://data.did.id/${props.value}`} target="_blank" rel="noreferrer">
              <AppendInputImg src="/static/dotbit.ico" alt="ico" className="alias-icon" />
            </a>
          </Tooltip>
        )
      }
      appendCard={
        <StyleWrapper>
          {!query.isLoading && query.isValidAlias && (
            <div className="list">
              {query.isError && !query?.error?.code && (
                <>
                  <div className="error">Search failed for unknown reason.</div>
                  <div className="error">
                    {/* eslint-disable-next-line no-script-url,jsx-a11y/anchor-is-valid */}
                    <a onClick={() => !query.isLoading && query.refetch()}>Retry searching</a>
                  </div>
                </>
              )}
              {query.isError && query.error!.code === BitIndexerErrorCode.AccountNotExist && (
                <div className="error">This .bit account is not yet registered.</div>
              )}
              {!query.isError && !addresses.length && (
                <div className="error">This .bit account has no selectable address.</div>
              )}
              {addresses.map((row) => (
                <DotBitL1AddressOption
                  data={row}
                  key={row.value}
                  selected={props.selected?.value === row.value}
                  onClick={() => onSelectOption(row)}
                />
              ))}
            </div>
          )}
        </StyleWrapper>
      }
    />
  );
}
