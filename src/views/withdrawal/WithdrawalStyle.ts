import styled from "styled-components";

export const PageContent = styled.div`
  width: 436px;
  background: rgb(39, 37, 52);
  border-radius: 24px;
  padding: 24px;
  color: white;
  .header {
    display: flex;
    justify-content: space-between;
  }
  .title {
    font-size: 20px;
    font-weight: 600;
    line-height: 1.1;
    margin-bottom: 20px;
  }
`;

export const ResultList = styled.div`
  > .header {
    -webkit-box-align: center;
    align-items: center;
    -webkit-box-pack: justify;
    justify-content: space-between;
    padding: 24px 0;
    width: 100%;
    border-bottom: 1px solid rgb(60, 58, 75);
    border-top: 1px solid rgb(60, 58, 75);
    font-size: 16px;
    font-weight: 600;
    line-height: 1.5;
  }
`;
