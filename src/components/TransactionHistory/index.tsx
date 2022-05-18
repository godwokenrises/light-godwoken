import { HistoryOutlined } from "@ant-design/icons";
import React, { useState } from "react";
import styled from "styled-components";
import { useChainId } from "../../hooks/useChainId";
import { useL1TxHistory } from "../../hooks/useL1TxHistory";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { ConfirmModal } from "../../style/common";
import { COLOR } from "../../style/variables";
import { Item } from "./item";

export const StyleWrapper = styled.div`
  cursor: pointer;
`;

export const HistoryList = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  color: ${COLOR.brand};
  a {
    text-decoration: none;
    color: ${COLOR.brand};
  }
`;

type TransactionHistoryProps = {
  type: "withdrawal" | "deposit";
};

export const TransactionHistory: React.FC<TransactionHistoryProps> = (prop) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const lightGodwoken = useLightGodwoken();
  const l1Address = lightGodwoken?.provider.getL1Address();
  const { data: chainId } = useChainId();
  const historyKey = `${chainId}/${l1Address}/${prop.type}`;
  const { txHistory } = useL1TxHistory(historyKey);
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
      <ConfirmModal
        title={prop.type === "deposit" ? "Deposit History" : "Withdraw History"}
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        width={400}
      >
        {txHistory.length === 0 && "there is no " + prop.type + " history"}
        {txHistory.map((history) => (
          <Item key={history.txHash} {...history}></Item>
        ))}
      </ConfirmModal>
    </StyleWrapper>
  );
};
