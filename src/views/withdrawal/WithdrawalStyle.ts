import styled from "styled-components";

export const WithdrawalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  .title {
    font-size: 20px;
    font-weight: 600;
    line-height: 1.1;
    margin-bottom: 20px;
  }
`;

export const ResultList = styled.div`
  padding: 24px;
  > .header {
    -webkit-box-align: center;
    align-items: center;
    -webkit-box-pack: justify;
    justify-content: space-between;
    padding: 24px 0;
    width: 100%;
    border-bottom: 1px solid white;
    border-top: 1px solid white;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.5;
  }
`;
