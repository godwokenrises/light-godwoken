import styled from "styled-components";
import { Modal } from "antd";
export const PageMain = styled.div`
  grid-auto-rows: auto;
  row-gap: 8px;
  .icon {
    width: 100%;
    display: flex;
    justify-content: center;
    padding-top: 8px;
    padding-bottom: 8px;
  }
`;

export const ConfirmModal = styled(Modal)`
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
    padding: 24px;
  }
  .ant-modal-close-x {
    color: black;
  }
  .ant-typography {
    color: black;
    justify-content: space-between;
  }
  .text-pair {
    padding-top: 5px;
    display: flex;
    justify-content: space-between;
    font-size: 24px;
  }
  .tips {
    margin: 24px 0;
  }
`;
