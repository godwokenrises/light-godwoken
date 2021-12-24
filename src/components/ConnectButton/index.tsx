import detectEthereumProvider from "@metamask/detect-provider";
import { Button } from "antd";
import styled from "styled-components";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { Address } from "../Address";
const StyleWrapper = styled(Button)`
  &.ant-btn-primary {
    background: rgb(60,58,75);
    border: none;
  }
`
export const ConnectButton: React.FC = () => {
  const lightGodwoken = useLightGodwoken();

  function connectWallet() {
    if (lightGodwoken) return;

    detectEthereumProvider().then((ethereum: any) => {
      ethereum.request({ method: "eth_requestAccounts" });
    });
  }

  return (
    <StyleWrapper type="primary" onClick={connectWallet}>
      {lightGodwoken ? <Address /> : "Connect"}
    </StyleWrapper>
  );
};
