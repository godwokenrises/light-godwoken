import { HistoryOutlined } from "@ant-design/icons";
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
  color: white;
  .ant-modal-content {
    border-radius: 32px;
    background: rgb(39, 37, 52);
    box-shadow: rgb(14 14 44 / 10%) 0px 20px 36px -8px, rgb(0 0 0 / 5%) 0px 1px 1px;
    border: 1px solid rgb(60, 58, 75);
    color: white;
  }
  .ant-modal-header {
    background: rgb(39, 37, 52);
    border: 1px solid rgb(60, 58, 75);
    border-top-left-radius: 32px;
    border-top-right-radius: 32px;
    padding: 12px 24px;
    height: 73px;
    display: flex;
    align-items: center;
  }
  .ant-modal-title,
  .ant-list-item {
    color: white;
  }
  .ant-modal-body {
    padding: 0px;
  }
  .ant-modal-close-x {
    color: white;
  }
  .ant-list-item {
    border-bottom: none;
    padding: 4px 20px;
    height: 56px;
    &:hover {
      background-color: rgb(60, 58, 75);
      cursor: pointer;
    }
    &.selected {
      background-color: rgb(60, 58, 75);
    }
  }
`;

export const TransactionHistory: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const lightGodwoken = useLightGodwoken();
  const l1Address = lightGodwoken?.provider.getL1Address();
  const { data: chainId } = useChainId();
  const { txHistory } = useL1TxHistory(`${chainId}/${l1Address}/withdrawal`);
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
          {txHistory.map((history) => {
            return (
              <a target="_blank" href={`${CKB_EXPLORER_URL}/transaction/${history.txHash}`} rel="noreferrer">
                {`${history.type} ${getDisplayAmount(BigInt(history.capacity))} CKB`}{" "}
                {history.amount && history.amount !== "0x0"
                  ? `and ${getDisplayAmount(BigInt(history.amount), history.decimals)} ${history.symbol}`
                  : ""}
              </a>
            );
          })}
        </HistoryList>
      </CKBModal>
    </StyleWrapper>
  );
};
