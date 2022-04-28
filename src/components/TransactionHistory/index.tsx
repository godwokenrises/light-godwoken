import { HistoryOutlined } from "@ant-design/icons";
import { BI } from "@ckb-lumos/lumos";
import { Modal } from "antd";
import React, { useState } from "react";
import styled from "styled-components";
import { CKB_EXPLORER_URL } from "../../config";
import { useChainId } from "../../hooks/useChainId";
import { useL1TxHistory } from "../../hooks/useL1TxHistory";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { getDisplayAmount } from "../../utils/formatTokenAmount";

export const StyleWrapper = styled.div`
  cursor: pointer;
`;

export const HistoryList = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  a {
    text-decoration: none;
    color: rgb(255, 67, 66);
  }
`;

const CKBModal = styled(Modal)`
  color: black;
  .ant-modal-content {
    border-radius: 32px;
    background: white;
    box-shadow: rgb(14 14 44 / 10%) 0px 20px 36px -8px, rgb(0 0 0 / 5%) 0px 1px 1px;
    border: 1px solid white;
    color: black;
  }
  .ant-modal-header {
    background: white;
    border: 1px solid white;
    border-top-left-radius: 32px;
    border-top-right-radius: 32px;
    padding: 12px 24px;
    height: 73px;
    display: flex;
    align-items: center;
  }
  .ant-modal-title,
  .ant-list-item {
    color: black;
  }
  .ant-modal-body {
    padding: 0px;
  }
  .ant-modal-close-x {
    color: black;
  }
  .ant-list-item {
    border-bottom: none;
    padding: 4px 20px;
    height: 56px;
    &:hover {
      background-color: white;
      cursor: pointer;
    }
    &.selected {
      background-color: white;
    }
  }
`;
type Props = {
  type: "withdrawal" | "deposit";
};

export const TransactionHistory: React.FC<Props> = (prop) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const lightGodwoken = useLightGodwoken();
  const l1Address = lightGodwoken?.provider.getL1Address();
  const { data: chainId } = useChainId();
  const { txHistory } = useL1TxHistory(`${chainId}/${l1Address}/${prop.type}`);
  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };
  return (
    <StyleWrapper>
      <HistoryOutlined onClick={showModal} />
      <CKBModal
        title="Recent Transactions"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
      >
        <HistoryList>
          {txHistory.length === 0 && "there is no transaction history"}
          {txHistory.map((history) => {
            return (
              <a target="_blank" href={`${CKB_EXPLORER_URL}/transaction/${history.txHash}`} rel="noreferrer">
                {`${history.type} ${getDisplayAmount(BI.from(history.capacity))} CKB`}{" "}
                {history.amount && history.amount !== "0x0"
                  ? `and ${getDisplayAmount(BI.from(history.amount), history.decimals)} ${history.symbol}`
                  : ""}
              </a>
            );
          })}
        </HistoryList>
      </CKBModal>
    </StyleWrapper>
  );
};
