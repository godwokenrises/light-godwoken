import styled from "styled-components";

export const PageContent = styled.div`
  width: 436px;
  background: white;
  border-radius: 24px;
  color: black;
  height: calc(100vh - 64px - 24px);
  @media (max-width: 600px) {
    width: calc(100% - 16px);
    margin: 0 8px;
    height: calc(100vh - 64px - 48px - 24px - 24px);
  }
`;

export const Text = styled.span`
  font-size: 12px;
  color: #666666;
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
    }
  }
  .second-row {
    margin-top: 18px;
    .symbol {
      color: #000;
    }
  }
`;

export const Row = styled.div`
  display: flex;
  justify-content: space-between;
  .ckb-logo {
    height: 22px;
    width: 22px;
    margin-right: 8px;
  }
  .max-button {
    height: 32px;
    padding: 0px 16px;
    background-color: transparent;
    color: rgb(255, 67, 66);
    font-weight: 600;
    &:hover {
      cursor: pointer;
    }
  }
`;
