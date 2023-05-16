import { LightGodwokenV0, EthereumProvider, LightGodwokenProvider } from "light-godwoken";
import { predefinedConfigs, GodwokenNetwork, GodwokenVersion } from "light-godwoken";
import { number, blockchain, createObjectCodec, enhancePack } from "@ckb-lumos/codec";
import { Cell } from "@ckb-lumos/base";
import { Reader } from "ckb-js-toolkit";

const { Byte32 } = blockchain;
const { Uint64, Uint128 } = number;
const RawWithdrawalLockArgsCodec = createObjectCodec({
  account_script_hash: Byte32,
  withdrawal_block_hash: Byte32,
  withdrawal_block_number: Uint64,
  // buyer can pay sell_amount token to unlock
  sudt_script_hash: Byte32,
  sell_amount: Uint128,
  sell_capacity: Uint64,
  // layer1 lock to withdraw after challenge period
  owner_lock_hash: Byte32,
  // layer1 lock to receive the payment, must exists on the chain
  payment_lock_hash: Byte32,
});
export const WithdrawalLockArgsCodec = enhancePack(
  RawWithdrawalLockArgsCodec,
  () => new Uint8Array(0),
  (buf: Uint8Array) => ({
    account_script_hash: buf.slice(0, 32),
    withdrawal_block_hash: buf.slice(32, 64),
    withdrawal_block_number: buf.slice(64, 72),
    sudt_script_hash: buf.slice(72, 104),
    sell_amount: buf.slice(104, 120),
    sell_capacity: buf.slice(120, 128),
    owner_lock_hash: buf.slice(128, 160),
    payment_lock_hash: buf.slice(160, 192),
  }),
);

// config
// https://github.com/Flouse/godwoken-examples/blob/benchmark/packages/tools/src/benchmark/accounts.ts
const privateKey = "0xf5e9bac200a2eca0b0eead8a327ef3dc148ba10e192d07badad2d195f2488b94";
const config = predefinedConfigs.testnet.v0;

/*
available withdrawal cell
{
  cell_output: {
    capacity: '0x62b85e900',
    lock: {
      args: '0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6ab6f642bafd4210557c25cbb0ced95fcb45c59071c41015ab5335f413b68c9aceffe7f68a0a8974165dcc33d856dd4da1e671e0feab29224b660e9f938d72b686316006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e40b5402000000f539266ebeebbc2084071b18e2659c6a46a21842ba60ec1e4f7787545be0c9490000000000000000000000000000000000000000000000000000000000000000',
      code_hash: '0x170ef156e9f6132dbca6069dfd3e436f7d91c29d3ac7332c4b33e633b6a299b5',
      hash_type: 'type'
    },
    type: null
  },
  data: '0x',
  out_point: {
    index: '0x16',
    tx_hash: '0xb563e5ee46e7cf71f1d9b408538f2ef54fa5c080ed0cedbe3899d7ee9300f5c7'
  },
  block_number: '0x59ad40'
}
*/

async function createLightGodwoken() {
  const ethereum = EthereumProvider.fromPrivateKey(config.layer2Config.GW_POLYJUICE_RPC_URL, privateKey);
  const ethAddress = await ethereum.getAddress();

  const lightGodwokenProvider = new LightGodwokenProvider({
    network: GodwokenNetwork.Testnet,
    version: GodwokenVersion.V0,
    ethAddress,
    ethereum,
    config,
  });

  return new LightGodwokenV0(lightGodwokenProvider);
}

async function unlockCell(client: LightGodwokenV0, cell: Cell) {
  try {
    const txHash = await client.unlock({ cell });
    console.log("unlock withdrawal cell succeed", txHash);
  } catch (e) {
    console.error("unlock withdrawal cell failed", e);
  }
}

async function main() {
  const client = await createLightGodwoken();
  const targetAccountScriptHash = client.provider.getLayer2LockScriptHash();

  const withdrawalLock = config.layer2Config.SCRIPTS.withdrawal_lock;
  const collector = client.provider.ckbIndexer.collector({
    argsLen: "any",
    order: "desc",
    lock: {
      hash_type: "type",
      code_hash: withdrawalLock.script_type_hash,
      args: `${config.layer2Config.ROLLUP_CONFIG.rollup_type_hash}${targetAccountScriptHash.slice(2)}`,
    },
    scriptSearchMode: "exact",
  });

  const cells: Cell[] = [];
  for await (const cell of collector.collect()) {
    const withdrawalLockArgsData = `0x${cell.cell_output.lock.args.slice(66)}`;
    const withdrawalLockArgs = WithdrawalLockArgsCodec.unpack(
      new Uint8Array(new Reader(withdrawalLockArgsData).toArrayBuffer()),
    );

    if (cell.out_point) {
      const latestFinalizedBlockNumber = await client.provider.getLastFinalizedBlockNumber();
      const expectBlockNumber =
        withdrawalLockArgs.withdrawal_block_number.toNumber() + config.layer2Config.FINALITY_BLOCKS;
      if (latestFinalizedBlockNumber < expectBlockNumber) {
        console.log("found matched cell, but it's not finalized yet");
        continue;
      }

      const cellWithStatus = await client.provider.ckbRpc.get_live_cell(cell.out_point, false);
      if (cellWithStatus.status !== "live") {
        console.log("found matched cell, but it's already been transferred");
        continue;
      }

      console.log("found matched live cell", cell);
      cells.push(cell);
    }
  }

  console.log(JSON.stringify(cells, null, 2));
  console.log("cells count", cells.length);
}

async function mainUnlock() {
  const client = await createLightGodwoken();
  await unlockCell(client, {
    cell_output: {
      capacity: "0x62b85e900",
      lock: {
        args: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6ab6f642bafd4210557c25cbb0ced95fcb45c59071c41015ab5335f413b68c9aceffe7f68a0a8974165dcc33d856dd4da1e671e0feab29224b660e9f938d72b686316006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e40b5402000000f539266ebeebbc2084071b18e2659c6a46a21842ba60ec1e4f7787545be0c9490000000000000000000000000000000000000000000000000000000000000000",
        code_hash: "0x170ef156e9f6132dbca6069dfd3e436f7d91c29d3ac7332c4b33e633b6a299b5",
        hash_type: "type",
      },
    },
    data: "0x",
    out_point: {
      index: "0x16",
      tx_hash: "0xb563e5ee46e7cf71f1d9b408538f2ef54fa5c080ed0cedbe3899d7ee9300f5c7",
    },
    block_number: "0x59ad40",
  });
}

function explainCell() {
  const cell: Cell = {
    cell_output: {
      capacity: "0x62b85e900",
      lock: {
        args: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6ab6f642bafd4210557c25cbb0ced95fcb45c59071c41015ab5335f413b68c9aceffe7f68a0a8974165dcc33d856dd4da1e671e0feab29224b660e9f938d72b686316006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e40b5402000000f539266ebeebbc2084071b18e2659c6a46a21842ba60ec1e4f7787545be0c9490000000000000000000000000000000000000000000000000000000000000000",
        code_hash: "0x170ef156e9f6132dbca6069dfd3e436f7d91c29d3ac7332c4b33e633b6a299b5",
        hash_type: "type",
      },
    },
    data: "0x",
    out_point: {
      index: "0x16",
      tx_hash: "0xb563e5ee46e7cf71f1d9b408538f2ef54fa5c080ed0cedbe3899d7ee9300f5c7",
    },
    block_number: "0x59ad40",
  };
  const withdrawalLockArgsData = `0x${cell.cell_output.lock.args.slice(66)}`;
  const withdrawalLockArgs = WithdrawalLockArgsCodec.unpack(
    new Uint8Array(new Reader(withdrawalLockArgsData).toArrayBuffer()),
  );

  console.log(withdrawalLockArgs);
}

explainCell();
