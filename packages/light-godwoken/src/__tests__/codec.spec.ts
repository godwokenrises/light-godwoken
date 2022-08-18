import { BI, toolkit } from "@ckb-lumos/lumos";
import { V0DepositLockArgs } from "../schemas/codecV0";
import { V1DepositLockArgs } from "../schemas/codecV1";
import { OmniLockWitnessLockCodec } from "../schemas/codecLayer1";
import { blockchain } from "@ckb-lumos/base";
import { bytes } from "@ckb-lumos/codec";
describe("test codec", () => {
  it("should codec omnilock", async () => {
    const signature = "0x22506400d99d605caa6a047ea3146a0ef8ac87ad38cb4549b64ca025640315f6";
    const serilized = bytes.hexify(
      blockchain.WitnessArgs.pack({
        lock: OmniLockWitnessLockCodec.pack({ signature }).buffer,
      }),
    );

    expect(serilized).toEqual(
      "0x4800000010000000480000004800000034000000340000001000000034000000340000002000000022506400d99d605caa6a047ea3146a0ef8ac87ad38cb4549b64ca025640315f6",
    );
  });
  it("should codec V0DepositLockArgs", async () => {
    const depositArgs = {
      owner_lock_hash: "0xea8e5a6ed260ee56af7d66ddb8c7c09a3ade6c38d207c30a6d11b3d8e11387df",
      layer2_lock: {
        codeHash: "0x07521d0aa8e66ef441ebc31204d86bb23fc83e9edc58c19dbb1b0ebe64336ec0",
        hashType: "type",
        args: "0x702359ea7f073558921eb50d8c1c77e92f760c8f8656bde4995f26b8963e2dd862a67949836b389ec146b3b2187e949f7faef679",
      },
      cancel_timeout: BI.from("0xc0000000000004b0"),
    };
    const serilized = new toolkit.Reader(V0DepositLockArgs.pack(depositArgs).buffer).serializeJson();

    expect(serilized).toEqual(
      "0xa1000000100000003000000099000000ea8e5a6ed260ee56af7d66ddb8c7c09a3ade6c38d207c30a6d11b3d8e11387df6900000010000000300000003100000007521d0aa8e66ef441ebc31204d86bb23fc83e9edc58c19dbb1b0ebe64336ec00134000000702359ea7f073558921eb50d8c1c77e92f760c8f8656bde4995f26b8963e2dd862a67949836b389ec146b3b2187e949f7faef679b0040000000000c0",
    );
  });
  it("should codec V1DepositLockArgs", async () => {
    const depositArgs = {
      owner_lock_hash: "0xea8e5a6ed260ee56af7d66ddb8c7c09a3ade6c38d207c30a6d11b3d8e11387df",
      layer2_lock: {
        codeHash: "0x07521d0aa8e66ef441ebc31204d86bb23fc83e9edc58c19dbb1b0ebe64336ec0",
        hashType: "type",
        args: "0x702359ea7f073558921eb50d8c1c77e92f760c8f8656bde4995f26b8963e2dd862a67949836b389ec146b3b2187e949f7faef679",
      },
      cancel_timeout: BI.from("0xc000000000093a81"),
      registry_id: 2,
    };
    const serilized = new toolkit.Reader(V1DepositLockArgs.pack(depositArgs).buffer).serializeJson();

    expect(serilized).toEqual(
      "0xa900000014000000340000009d000000a5000000ea8e5a6ed260ee56af7d66ddb8c7c09a3ade6c38d207c30a6d11b3d8e11387df6900000010000000300000003100000007521d0aa8e66ef441ebc31204d86bb23fc83e9edc58c19dbb1b0ebe64336ec00134000000702359ea7f073558921eb50d8c1c77e92f760c8f8656bde4995f26b8963e2dd862a67949836b389ec146b3b2187e949f7faef679813a0900000000c002000000",
    );
  });
});
