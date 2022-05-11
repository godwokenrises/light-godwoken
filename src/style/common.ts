import { Modal } from "antd";
import styled from "styled-components";

export const Card = styled.div`
  width: 400px;
  background: white;
  border-radius: 24px;
  color: black;
  padding: 24px;
  margin-bottom: 16px;
  @media (max-width: 600px) {
    width: calc(100% - 8px);
    margin: 16px 4px 64px;
  }
`;
export const PageContent = styled.div`
  width: 400px;
  @media (max-width: 600px) {
    width: calc(100% - 16px);
  }
`;
export const Text = styled.span`
  font-size: 12px;
  color: #666666;
  overflow-wrap: break-word;
`;
export const MainText = styled.span`
  font-size: 14px;
  color: #000000;
  overflow-wrap: break-word;
`;

export const PrimaryText = styled.span`
  font-size: 12px;
  color: #000000;
  overflow-wrap: break-word;
`;

export const InputCard = styled.div`
  font-size: 14px;
  border-radius: 16px;
  background-color: #f3f3f3;
  box-shadow: rgb(74 74 104 / 10%) 0px 2px 2px -1px;
  padding: 20px 16px;
  .anticon {
    font-size: 12px;
  }
  .first-row {
    font-size: 12px;
    color: #666;
    font-weight: bold;
    .balance {
      color: #00cc9b;
      text-decoration-line: underline;
      font-weight: normal;
      cursor: pointer;
    }
  }
  .second-row {
    margin-top: 18px;
    .symbol {
      color: #000;
      margin-left: 5px;
    }
  }
`;

export const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  .ckb-logo {
    height: 22px;
    width: 22px;
    margin-right: 8px;
  }
`;

export const PrimaryButton = styled.button`
  height: 48px;
  width: 100%;
  padding: 0px 24px;
  margin-top: 24px;
  background-color: #00cc9b;
  color: white;
  border: 0px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 0.03em;
  line-height: 1;
  &:disabled {
    background-color: rgba(0, 204, 155, 0.5);
    cursor: not-allowed;
  }
  &:hover {
    cursor: pointer;
  }
`;

export const SecondeButton = styled.button`
  height: 32px;
  width: 100px;
  padding: 0px 10px;
  background-color: #00cc9b;
  color: white;
  border: 0px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  line-height: 1;
  &:disabled {
    cursor: not-allowed;
  }
  &:hover {
    cursor: pointer;
  }
`;
export const PlainButton = styled.button`
  height: 32px;
  width: 100px;
  padding: 0px 10px;
  background-color: #999999;
  color: white;
  border: 0px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  line-height: 1;
  &:disabled {
    cursor: not-allowed;
  }
  &:hover {
    cursor: pointer;
  }
`;

export const ConfirmModal = styled(Modal)`
  color: black;
  .ant-modal-content {
    border-radius: 32px;
    background: white;
    border: 1px solid white;
  }
  .ant-modal-header {
    background: white;
    border: 1px solid white;
    border-top-left-radius: 32px;
    border-top-right-radius: 32px;
    padding: 24px;
    display: flex;
    align-items: center;
  }
  .ant-list-item {
    color: black;
  }
  .ant-modal-title {
    font-size: 12px;
    color: #666;
    font-weight: bold;
  }
  .ant-modal-body {
    padding: 0 24px 12px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .ant-modal-close-x {
    color: black;
  }
  .ant-typography {
    color: black;
    justify-content: space-between;
  }
`;

export const PlusIconContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  padding-top: 8px;
  padding-bottom: 8px;
`;

export const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 24px;
  .title {
    padding-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    > span {
      font-weight: bold;
      font-size: 18px;
      color: #333;
    }
  }
  .description {
    font-size: 12px;
    font-weight: bold;
    color: #333;
  }
`;

export const InputInfo = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  margin-bottom: 12px;
  .title {
    font-size: 14px;
    color: #333;
    font-weight: bold;
  }
  .amount {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: end;
    img,
    svg {
      width: 22px;
      height: 22px;
      margin: 0 10px 0 16px;
    }
    .ckb-amount {
      display: flex;
    }
    .ckb-amount + .sudt-amount {
      margin-top: 10px;
    }
  }
`;
export const Actions = styled.div`
  margin-top: 64px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  button + button {
    margin-left: 16px;
  }
`;
