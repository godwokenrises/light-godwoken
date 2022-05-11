import styled from "styled-components";
import { ClaimSudt } from "../ClaimSudt";

const StyleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  a {
    color: #000;
    text-decoration: none;
  }
  > a,
  > div {
    height: 33px;
    padding: 0 10px;
    border-radius: 8px;
    margin: 4px 0px;
    text-align: center;
    line-height: 33px;
    font-size: 14px;
    font-weight: bold;
    &:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #000;
    }
  }
`;
type Props = {
  handleClick: () => void;
};
export const PopoverMenu: React.FC<Props> = ({ handleClick }) => {
  return (
    <StyleWrapper>
      <div className="claim-sudt-container" onClick={handleClick}>
        <ClaimSudt />
      </div>
      <a href="https://faucet.nervos.org/" target="_blank" rel="noreferrer" onClick={handleClick}>
        CKB Testnet Faucet
      </a>
    </StyleWrapper>
  );
};
