import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { notification, Tooltip } from "antd";
import { BI, Cell, Hash, utils } from "@ckb-lumos/lumos";
import { captureException } from "@sentry/react";
import { LoadingOutlined } from "@ant-design/icons";
import { NotEnoughCapacityError, ProxyERC20 } from "light-godwoken";
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
import { TokenInfoWithAmount } from "./TokenInfoWithAmount";
import { getDisplayAmount } from "../../utils/formatTokenAmount";
import { useL1UnlockHistory } from "../../hooks/useL1UnlockHistory";

const ModalContent = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;

  .amount {
    padding: 12px;
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
    .ckb-icon {
      display: flex;
      align-items: center;
    }
    .ckb-amount {
      display: flex;
    }
    .sudt-amount + .ckb-amount {
      margin-top: 4px;
    }
  }
  .title {
    font-size: 14px;
    font-weight: bold;
  }
`;

export interface UnlockProps {
  layer1TxHash: Hash;
  erc20?: ProxyERC20;
  cell: Cell;
}

const Unlock: React.FC<UnlockProps> = ({ layer1TxHash, erc20, cell }) => {
  // light-godwoken client
  const lightGodwoken = useLightGodwoken();
  const l1Address = useMemo(() => lightGodwoken?.provider.getL1Address(), [lightGodwoken]);

  // state
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // tx history
  const godwokenVersion = useGodwokenVersion();
  const { addUnlockHistoryItem } = useL1UnlockHistory(`${godwokenVersion}/${l1Address}/unlock`);

  // ckb capacity
  const ckbCapacity = useMemo(() => {
    return getDisplayAmount(BI.from(cell.cell_output.capacity), 8);
  }, [cell.cell_output.capacity]);

  // sudt
  const amount = useMemo(() => {
    return cell.cell_output.type ? utils.readBigUInt128LECompatible(cell.data) : "0x0";
  }, [cell]);

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
      addUnlockHistoryItem({
        withdrawalTxHash: layer1TxHash,
        unlockTxHash: txHash,
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
      <Tooltip title="Unlock withdrawal to your address">
        <SecondeButton className="withdraw-button" onClick={showCurrencySelectModal}>
          Unlock
        </SecondeButton>
      </Tooltip>
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
            {erc20 && <TokenInfoWithAmount amount={amount} {...erc20} />}
            <div className="ckb-amount">
              <div className="ckb-icon">
                <CKBIcon />
              </div>
              <MainText>{ckbCapacity} CKB</MainText>
            </div>
          </div>

          <Text className="title">Unlock to address</Text>
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
