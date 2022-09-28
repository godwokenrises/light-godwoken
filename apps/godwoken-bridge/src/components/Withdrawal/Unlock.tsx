import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { notification } from "antd";
import { utils as ethersUtils } from "ethers";
import { BI, Cell, utils } from "@ckb-lumos/lumos";
import { captureException } from "@sentry/react";
import { LoadingOutlined } from "@ant-design/icons";
import { NotEnoughCapacityError, ProxyERC20, SUDT } from "light-godwoken";
import {
  Actions,
  ConfirmModal,
  LoadingWrapper,
  MainText,
  PlainButton,
  SecondeButton,
  Text,
  Tips,
} from "../../style/common";
import { ReactComponent as CKBIcon } from "../../assets/ckb.svg";
import { isInstanceOfLightGodwokenV0 } from "../../utils/typeAssert";
import { useGodwokenVersion } from "../../hooks/useGodwokenVersion";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import { useL1TxHistory } from "../../hooks/useL1TxHistory";
import { TokenInfoWithAmount } from "./TokenInfoWithAmount";
import { getDisplayAmount } from "../../utils/formatTokenAmount";

const ModalContent = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;

  .amount {
    padding: 6px 12px 8px 12px;
    margin-bottom: 12px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-radius: 16px;
    border: 1px solid rgba(0, 0, 0, 0.2);

    img,
    svg {
      width: 22px;
      height: 22px;
      margin-right: 5px;
    }
    .ckb-amount {
      display: flex;
    }
    .sudt-amount + .ckb-amount {
      margin-top: 10px;
    }
  }
  .title {
    font-size: 14px;
    font-weight: bold;
  }
`;

export interface UnlockProps {
  erc20?: ProxyERC20;
  cell: Cell;
}

const Unlock: React.FC<UnlockProps> = ({ erc20, cell }) => {
  // light-godwoken client
  const lightGodwoken = useLightGodwoken();
  const l1Address = useMemo(() => lightGodwoken?.provider.getL1Address(), [lightGodwoken]);
  const tokenMap = useMemo(() => lightGodwoken?.getBuiltinSUDTMapByTypeHash() || {}, [lightGodwoken]);

  // state
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // tx history
  const godwokenVersion = useGodwokenVersion();
  const { addTxToHistory } = useL1TxHistory(`${godwokenVersion}/${l1Address}/withdrawal`);

  // ckb capacity
  const ckbCapacity = useMemo(() => {
    console.log(cell.cell_output.capacity);
    const capacity = ethersUtils.parseUnits(BI.from(cell.cell_output.capacity).toString(), 8).toHexString();
    return getDisplayAmount(BI.from(capacity), 8);
  }, [cell.cell_output.capacity]);

  // sudt
  let token: SUDT | undefined;
  let amount: string | undefined;
  if (cell.cell_output.type) {
    token = tokenMap[utils.computeScriptHash(cell.cell_output.type)];
    amount = utils.readBigUInt128LECompatible(cell.data).toHexString();
  }

  if (lightGodwoken?.getVersion().toString() !== "v0") {
    return <></>;
  }

  async function unlock() {
    if (!isInstanceOfLightGodwokenV0(lightGodwoken)) {
      return;
    }

    setIsUnlocking(true);
    try {
      const txHash = await lightGodwoken.unlock({ cell });
      addTxToHistory({
        type: "withdrawal",
        txHash,
        capacity: cell.cell_output.capacity,
        amount: amount || "0x0",
        token: token,
        status: "succeed",
      });

      notification.success({
        message: `Unlock Tx(${txHash}) success`,
        onClick: () => linkToExplorer(txHash),
      });
    } catch (e) {
      handleError(e);
    } finally {
      setIsUnlocking(false);
      setIsModalVisible(false);
    }
  }

  function linkToExplorer(txHash: string) {
    if (!lightGodwoken) return;
    const config = lightGodwoken.getConfig();
    window.open(`${config.layer1Config.SCANNER_URL}/transaction/${txHash}`, "_blank");
  }
  function handleError(e: unknown) {
    (() => {
      console.error(e);
      if (e instanceof NotEnoughCapacityError) {
        notification.error({ message: `Unlock Transaction fail, you need to get some ckb on L1 first` });
        return;
      }
      if (e instanceof Error) {
        notification.error({ message: `Unknown error, please try again later` });
      }
    })();

    captureException(e);
  }

  function showCurrencySelectModal() {
    setIsModalVisible(true);
  }
  function handleOk() {
    setIsModalVisible(false);
  }
  function handleCancel() {
    setIsModalVisible(false);
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <SecondeButton className="withdraw-button" onClick={showCurrencySelectModal}>
        Unlock
      </SecondeButton>
      <ConfirmModal
        title="Unlock Withdrawal"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        width={400}
      >
        <ModalContent>
          <div className="amount">
            {erc20 && <TokenInfoWithAmount amount={BI.from(amount || "0x0")} {...erc20} />}
            <div className="ckb-amount">
              <div className="ckb-icon">
                <CKBIcon />
              </div>
              <MainText>{ckbCapacity}</MainText>
            </div>
          </div>

          <Text className="title">Unlock target address</Text>
          <Text>{l1Address}</Text>

          {isUnlocking && (
            <LoadingWrapper>
              <LoadingOutlined />
            </LoadingWrapper>
          )}
          {isUnlocking && <Tips>Waiting for User Confirmation</Tips>}

          <Actions>
            <PlainButton className="cancel" onClick={handleCancel}>
              Cancel
            </PlainButton>
            <SecondeButton className="confirm" onClick={unlock} disabled={isUnlocking}>
              Confirm
            </SecondeButton>
          </Actions>
        </ModalContent>
      </ConfirmModal>
    </div>
  );
};

export default Unlock;
