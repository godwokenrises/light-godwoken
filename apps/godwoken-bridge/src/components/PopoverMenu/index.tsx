import styled from "styled-components";
import { COLOR } from "../../style/variables";
import { ClaimSudt } from "../ClaimSudt";

const StyleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  > a,
  > div {
    color: ${COLOR.primary};
    text-decoration: none;
    cursor: pointer;
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
      color: ${COLOR.primary};
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
      <a href="apps/godwoken-bridge/src/components/PopoverMenu/index" target="_blank" rel="noreferrer" onClick={handleClick}>
        CKB Testnet Faucet
      </a>
    </StyleWrapper>
  );
};
