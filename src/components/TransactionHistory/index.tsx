import { HistoryOutlined } from "@ant-design/icons";
import { BI } from "@ckb-lumos/lumos";
import React, { useState } from "react";
import styled from "styled-components";
import { useChainId } from "../../hooks/useChainId";
import { useL1TxHistory } from "../../hooks/useL1TxHistory";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { ConfirmModal } from "../../style/common";
import { COLOR } from "../../style/variables";
import { getDisplayAmount } from "../../utils/formatTokenAmount";

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
  const scannerUrl = lightGodwoken?.getConfig().layer1Config.SCANNER_URL;
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
        title="Recent Transactions"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        width={400}
      >
        <HistoryList>
          {txHistory.length === 0 && "there is no transaction history"}
          {txHistory.map((history) => {
            const historyCKBDescription = `${history.type} ${getDisplayAmount(BI.from(history.capacity))} CKB  `;
            const historySUDTDescription =
              history.amount && history.amount !== "0x0"
                ? `and ${getDisplayAmount(BI.from(history.amount), history.decimals)} ${history.symbol}`
                : "";
            const historyDescription = historyCKBDescription + historySUDTDescription;
            return prop.type === "deposit" ? (
              <a
                key={history.txHash}
                target="_blank"
                href={`${scannerUrl}/transaction/${history.txHash}`}
                rel="noreferrer"
              >
                {historyDescription}
              </a>
            ) : (
              <span key={history.txHash}>{historyDescription}</span>
            );
          })}
        </HistoryList>
      </ConfirmModal>
    </StyleWrapper>
  );
};
