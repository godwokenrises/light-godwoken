import sinon from "sinon";
import LightGodwokenV0 from "../LightGodwokenV0";
import DefaultLightGodwokenProvider from "../lightGodwokenProvider";
import { testConfig } from "./lightGodwokenConfig";

let lightGodwokenV0: LightGodwokenV0;
let lightGodwokenProviderV0: DefaultLightGodwokenProvider;
beforeEach(() => {
  const ethAddress = "0x62A67949836b389ec146B3B2187e949F7fAEF679";
  const dummyEthereum = {
    on: () => {},
  };
  lightGodwokenProviderV0 = new DefaultLightGodwokenProvider(ethAddress, dummyEthereum, "v0", testConfig.v0);
  lightGodwokenV0 = new LightGodwokenV0(lightGodwokenProviderV0);
});

const mockDepositListRpcResult = [
  {
    block_number: "0x529800",
    out_point: {
      index: "0x0",
      tx_hash: "0xa1586e19cdcbc95f533f1cc76a96363cebaba3d230439ddafe5212d6b97e9cd2",
    },
    output: {
      capacity: "0xbaa315500",
      lock: {
        args: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6aa1000000100000003000000099000000ea8e5a6ed260ee56af7d66ddb8c7c09a3ade6c38d207c30a6d11b3d8e11387df69000000100000003000000031000000deec13a7b8e100579541384ccaf4b5223733e4a5483c3aec95ddc4c1d5ea5b2201340000004cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a62a67949836b389ec146b3b2187e949f7faef67901000000000000c0",
        code_hash: "0x5a2506bb68d81a11dcadad4cb7eae62a17c43c619fe47ac8037bc8ce2dd90360",
        hash_type: "type",
      },
      type: null,
    },
    output_data: "0x",
    tx_index: "0x6",
  },
  {
    block_number: "0x533c0b",
    out_point: {
      index: "0x0",
      tx_hash: "0xca87d481f3ec1d43ed0b9088c363805f62048113969bdd0768a8f4f30a450136",
    },
    output: {
      capacity: "0x962113300",
      lock: {
        args: "0x4cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6aa1000000100000003000000099000000ea8e5a6ed260ee56af7d66ddb8c7c09a3ade6c38d207c30a6d11b3d8e11387df69000000100000003000000031000000deec13a7b8e100579541384ccaf4b5223733e4a5483c3aec95ddc4c1d5ea5b2201340000004cc2e6526204ae6a2e8fcf12f7ad472f41a1606d5b9624beebd215d780809f6a62a67949836b389ec146b3b2187e949f7faef67901000000000000c0",
        code_hash: "0x5a2506bb68d81a11dcadad4cb7eae62a17c43c619fe47ac8037bc8ce2dd90360",
        hash_type: "type",
      },
      type: null,
    },
    output_data: "0x",
    tx_index: "0x2",
  },
];

describe("test light godwoken v0 deposit list", () => {
  it("should generateDepositLock works fine", async () => {
    const depositList = await lightGodwokenV0.getDepositList();
    const mockCollector = { collect: sinon.stub().returns(mockDepositListRpcResult) };
    sinon.stub(lightGodwokenProviderV0.ckbIndexer, "collector").returns(mockCollector);
    expect(depositList.length).toBe(2);
    expect(depositList[0].capacity.toString()).toBe("50100000000");
    expect(depositList[1].capacity.toString()).toBe("40300000000");
  });
});
