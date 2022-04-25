import LightGodwokenV1 from "../LightGodwokenV1";
import DefaultLightGodwokenProvider from "../lightGodwokenProvider";
import sinon from "sinon";

let lightGodwoken: LightGodwokenV1;
let lightGodwokenProvider: DefaultLightGodwokenProvider;
beforeEach(() => {
  const ethAddress = "0x0C1EfCCa2Bcb65A532274f3eF24c044EF4ab6D73";
  const dummyEthereum = {
    on: () => {},
  };
  lightGodwokenProvider = new DefaultLightGodwokenProvider(ethAddress, dummyEthereum, "v1");
  lightGodwoken = new LightGodwokenV1(lightGodwokenProvider);
});

/**
 * @jest-environment jsdom
 */

const getCellResult = [
  {
    block_number: "0xf",
    out_point: {
      index: "0x0",
      tx_hash: "0x7bf16bc3b8fb6dd44e7a3b9fdd5dcd40d95cc00e3be64098c30f266bc5f92466",
    },
    cell_output: {
      capacity: "0x11da8d9ea2c3",
      lock: {
        args: "0xa1db2eef3f29f3ef6f86c8d2a0772c705c449f4a",
        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
      },
      type: null,
    },
    output_data: "0x",
    tx_index: "0x0",
  },
  {
    block_number: "0x10",
    out_point: {
      index: "0x0",
      tx_hash: "0x26655b551261cc6f97d61cb6dff1ac6b832cef74e0a8f4607e2ecd21c2842ab5",
    },
    cell_output: {
      capacity: "0x11da8da64840",
      lock: {
        args: "0xa1db2eef3f29f3ef6f86c8d2a0772c705c449f4a",
        code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
      },
      type: null,
    },
    output_data: "0x",
    tx_index: "0x0",
  },
];

describe("test light godwoken", () => {
  it("should generate deposit tx", async () => {
    const mockCollector = { collect: sinon.stub().onFirstCall().returns(getCellResult) };
    mockCollector.collect.onFirstCall().returns(getCellResult).onSecondCall().returns(getCellResult);

    sinon.stub(lightGodwokenProvider.ckbIndexer, "collector").returns(mockCollector);
    const tx = await lightGodwoken.generateDepositTx({ capacity: "0x11fe" });
    const expectedCellDep = [
      {
        dep_type: "code",
        out_point: { index: "0x0", tx_hash: "0x9154df4f7336402114d04495175b37390ce86a4906d2d4001cf02c3e6d97f39c" },
      },
      {
        dep_type: "dep_group",
        out_point: { index: "0x0", tx_hash: "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37" },
      },
    ];
    const expectedInputs = [
      {
        block_number: "0xf",
        cell_output: {
          capacity: "0x11da8d9ea2c3",
          lock: {
            args: "0xa1db2eef3f29f3ef6f86c8d2a0772c705c449f4a",
            code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
            hash_type: "type",
          },
          type: null,
        },
        out_point: { index: "0x0", tx_hash: "0x7bf16bc3b8fb6dd44e7a3b9fdd5dcd40d95cc00e3be64098c30f266bc5f92466" },
        output_data: "0x",
        tx_index: "0x0",
      },
    ];
    const expectedOutputs = [
      {
        cell_output: {
          capacity: "0x11fe",
          lock: {
            args: "0x4940246f168f4106429dc641add3381a44b5eef61e7754142f594e986671a575a10000001000000030000000990000003837aad0e28da55d366d62b7df9b1b0613c39c730c4c409b9722d4bed8cfa9266900000010000000300000003100000010571f91073fdc3cdef4ddad96b4204dd30d6355f3dda9a6d7fc0fa0326408da01340000004940246f168f4106429dc641add3381a44b5eef61e7754142f594e986671a5750c1efcca2bcb65a532274f3ef24c044ef4ab6d73b0040000000000c0",
            code_hash: "0xcc2b4e14d7dfeb1e72f7708ac2d7f636ae222b003bac6bccfcf8f4dfebd9c714",
            hash_type: "type",
          },
        },
        data: "0x",
      },
      {
        cell_output: {
          capacity: "0x11da8d9e90c5",
          lock: {
            args: "0x010c1efcca2bcb65a532274f3ef24c044ef4ab6d7300",
            code_hash: "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
            hash_type: "type",
          },
        },
        data: "0x",
      },
    ];
    expect(tx.cellDeps.toArray()).toEqual(expectedCellDep);
    expect(tx.inputs.toArray()).toEqual(expectedInputs);
    expect(tx.outputs.toArray()).toEqual(expectedOutputs);
  });
});
