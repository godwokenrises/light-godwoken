import { EventEmitter } from "events";
import sinon from "sinon";
import LightGodwokenV1 from "../LightGodwokenV1";
import LightGodwokenV0 from "../LightGodwokenV0";
import DefaultLightGodwokenProvider from "../lightGodwokenProvider";
import { deBifyRawWithdrawalRequestV0, deBifyRawWithdrawalRequestV1, dummyScriptHash } from "./utils";
import { BI } from "@ckb-lumos/lumos";
import { testConfig } from "./lightGodwokenConfig";

let lightGodwokenV0: LightGodwokenV0;
let lightGodwokenV1: LightGodwokenV1;
let lightGodwokenProviderV0: DefaultLightGodwokenProvider;
let lightGodwokenProviderV1: DefaultLightGodwokenProvider;
beforeEach(() => {
  const ethAddress = "0x0C1EfCCa2Bcb65A532274f3eF24c044EF4ab6D73";
  const dummyEthereum = {
    on: () => {},
  };
  lightGodwokenProviderV1 = new DefaultLightGodwokenProvider(ethAddress, dummyEthereum, "v1", testConfig.v1);
  lightGodwokenV1 = new LightGodwokenV1(lightGodwokenProviderV1);
  lightGodwokenProviderV0 = new DefaultLightGodwokenProvider(ethAddress, dummyEthereum, "v0", testConfig.v0);
  lightGodwokenV0 = new LightGodwokenV0(lightGodwokenProviderV0);
  sinon.stub(lightGodwokenV1.godwokenClient, "getAccountIdByScriptHash").returns(Promise.resolve(9));
  sinon.stub(lightGodwokenV1.godwokenClient, "getNonce").returns(Promise.resolve(1));
  sinon.stub(lightGodwokenV1.godwokenClient, "getChainId").returns(Promise.resolve("0x11"));

  sinon.stub(lightGodwokenV0.godwokenClient, "getAccountIdByScriptHash").returns(Promise.resolve("0x10"));
  sinon.stub(lightGodwokenV0.godwokenClient, "getNonce").returns(Promise.resolve("0x02"));
  sinon.stub(lightGodwokenV0.godwokenClient, "getChainId").returns(Promise.resolve("0x12"));
});

describe("test light godwoken v1 withdrawal", () => {
  it("should generate RawWithdrawalRequest when withdraw 2000 ckb and user balance is 2000", async () => {
    sinon.stub(lightGodwokenV1, "getL2CkbBalance").returns(Promise.resolve(BI.from(200000000000).toHexString()));
    const eventEmitter = new EventEmitter();
    const rawWithdrawalRequest = await lightGodwokenV1.generateRawWithdrawalRequest(eventEmitter, {
      capacity: "0x2e90edd000",
      amount: "0x0",
      sudt_script_hash: dummyScriptHash,
    });

    expect(deBifyRawWithdrawalRequestV1(rawWithdrawalRequest)).toEqual({
      account_script_hash: "0x7ad59fa0e426c5e5b0bc13f25bcae43263ab3be70fcb2d36bdb6df2119e7bea5",
      amount: "0x0",
      capacity: "0x2e90edd000",
      chain_id: "0x11",
      fee: "0x0",
      nonce: 1,
      owner_lock_hash: "0x3837aad0e28da55d366d62b7df9b1b0613c39c730c4c409b9722d4bed8cfa926",
      registry_id: 2,
      sudt_script_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    });
  });

  it("should throw error when withdraw 2000 ckb and user balance is 1999", async () => {
    sinon.stub(lightGodwokenV1, "getL2CkbBalance").returns(Promise.resolve(BI.from(199900000000).toHexString()));
    const eventEmitter = { emit: jest.fn() };
    let errMsg = "";
    try {
      await lightGodwokenV1.generateRawWithdrawalRequest(eventEmitter as any, {
        capacity: "0x2e90edd000",
        amount: "0x0",
        sudt_script_hash: dummyScriptHash,
      });
    } catch (error) {
      errMsg = (error as any).message;
    }
    expect(errMsg).toEqual("Insufficient CKB balance(199900000000) on Godwoken, required 200000000000");
  });

  it("should generate RawWithdrawalRequest when withdraw 2000 ckb and 2000 sudt and user balance is 2000 ckb and 2000 sudt", async () => {
    const erc20Address = lightGodwokenV1.getBuiltinErc20List()[0].sudt_script_hash;
    sinon.stub(lightGodwokenV1, "getL2CkbBalance").returns(Promise.resolve(BI.from(200000000000).toHexString()));
    sinon.stub(lightGodwokenV1, "getErc20Balance").returns(Promise.resolve("0x6c6b935b8bbd400000"));
    const eventEmitter = new EventEmitter();
    const rawWithdrawalRequest = await lightGodwokenV1.generateRawWithdrawalRequest(eventEmitter, {
      capacity: "0x2e90edd000",
      amount: "0x6c6b935b8bbd400000",
      sudt_script_hash: erc20Address,
    });

    expect(deBifyRawWithdrawalRequestV1(rawWithdrawalRequest)).toEqual({
      account_script_hash: "0x7ad59fa0e426c5e5b0bc13f25bcae43263ab3be70fcb2d36bdb6df2119e7bea5",
      amount: "0x6c6b935b8bbd400000",
      capacity: "0x2e90edd000",
      chain_id: "0x11",
      fee: "0x0",
      nonce: 1,
      owner_lock_hash: "0x3837aad0e28da55d366d62b7df9b1b0613c39c730c4c409b9722d4bed8cfa926",
      registry_id: 2,
      sudt_script_hash: "0xdac0c53c572f451e56c092fdb520aec82f5f4bf8a5c02e1c4843f40c15f84c55",
    });
  });
  it("should throw error when withdraw 2000 ckb and 2000 sudt and user balance is 2000 ckb and 1999 sudt", async () => {
    const erc20Address = lightGodwokenV1.getBuiltinErc20List()[0].sudt_script_hash;
    sinon.stub(lightGodwokenV1, "getL2CkbBalance").returns(Promise.resolve(BI.from(200000000000).toHexString()));
    sinon.stub(lightGodwokenV1, "getErc20Balance").returns(Promise.resolve("0x6c5db2a4d815dc0000"));
    const eventEmitter = { emit: jest.fn() };
    let errMsg = "";
    try {
      await lightGodwokenV1.generateRawWithdrawalRequest(eventEmitter as any, {
        capacity: "0x2e90edd000",
        amount: "0x6c6b935b8bbd400000",
        sudt_script_hash: erc20Address,
      });
    } catch (error) {
      errMsg = (error as any).message;
    }
    expect(errMsg).toEqual(
      "Insufficient USDC balance(1999000000000000000000) on Godwoken, Required: 2000000000000000000000",
    );
  });
});

describe("test light godwoken v0 withdrawal", () => {
  it("should generate RawWithdrawalRequest when withdraw 2000 ckb and user balance is 2000", async () => {
    sinon.stub(lightGodwokenV0, "getL2CkbBalance").returns(Promise.resolve(BI.from(200000000000).toHexString()));

    const eventEmitter = new EventEmitter();
    const rawWithdrawalRequest = await lightGodwokenV0.generateRawWithdrawalRequest(eventEmitter, {
      capacity: "0x2e90edd000",
      amount: "0x0",
      sudt_script_hash: dummyScriptHash,
    });

    expect(deBifyRawWithdrawalRequestV0(rawWithdrawalRequest)).toEqual({
      account_script_hash: "0xe913f07b850fb1f310d78cde13681681f6c4b472724017b9d8ae2d32baf6ddb9",
      amount: "0x0",
      capacity: "0x2e90edd000",
      fee: { amount: "0x0", sudt_id: 1 },
      nonce: 2,
      owner_lock_hash: "0x3837aad0e28da55d366d62b7df9b1b0613c39c730c4c409b9722d4bed8cfa926",
      payment_lock_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      sell_amount: "0x0",
      sell_capacity: "0x0",
      sudt_script_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    });
  });
  it("should throw error when withdraw 2000 ckb and user balance is 1999", async () => {
    sinon.stub(lightGodwokenV0, "getL2CkbBalance").returns(Promise.resolve(BI.from(199900000000).toHexString()));
    const eventEmitter = { emit: jest.fn() };
    let errMsg = "";
    try {
      await lightGodwokenV0.generateRawWithdrawalRequest(eventEmitter as any, {
        capacity: "0x2e90edd000",
        amount: "0x0",
        sudt_script_hash: dummyScriptHash,
      });
    } catch (error) {
      errMsg = (error as any).message;
    }
    expect(errMsg).toEqual("Godwoken CKB balance 199900000000 is less than 200000000000");
  });

  it("should generate RawWithdrawalRequest when withdraw 2000 ckb and 2000 sudt and user balance is 2000 ckb and 2000 sudt", async () => {
    const erc20Address = lightGodwokenV0.getBuiltinErc20List()[0].sudt_script_hash;
    sinon.stub(lightGodwokenV0, "getL2CkbBalance").returns(Promise.resolve(BI.from(200000000000).toHexString()));
    sinon.stub(lightGodwokenV0, "getBuiltinErc20ByTypeHash").returns({ address: "" } as any);
    sinon.stub(lightGodwokenV0, "getErc20Balance").returns(Promise.resolve("0x6c6b935b8bbd400000"));
    const eventEmitter = { emit: jest.fn() };
    const rawWithdrawalRequest = await lightGodwokenV0.generateRawWithdrawalRequest(eventEmitter as any, {
      capacity: "0x2e90edd000",
      amount: "0x6c6b935b8bbd400000",
      sudt_script_hash: erc20Address,
    });

    expect(deBifyRawWithdrawalRequestV0(rawWithdrawalRequest)).toEqual({
      account_script_hash: "0xe913f07b850fb1f310d78cde13681681f6c4b472724017b9d8ae2d32baf6ddb9",
      amount: "0x6c6b935b8bbd400000",
      capacity: "0x2e90edd000",
      fee: { amount: "0x0", sudt_id: 1 },
      nonce: 2,
      owner_lock_hash: "0x3837aad0e28da55d366d62b7df9b1b0613c39c730c4c409b9722d4bed8cfa926",
      payment_lock_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      sell_amount: "0x0",
      sell_capacity: "0x0",
      sudt_script_hash: "0xdac0c53c572f451e56c092fdb520aec82f5f4bf8a5c02e1c4843f40c15f84c55",
    });
  });

  it("should throw error when withdraw 2000 ckb and 2000 sudt and user balance is 2000 ckb and 1999 sudt", async () => {
    const erc20Address = lightGodwokenV0.getBuiltinErc20List()[0].sudt_script_hash;
    sinon.stub(lightGodwokenV0, "getL2CkbBalance").returns(Promise.resolve(BI.from(200000000000).toHexString()));
    sinon.stub(lightGodwokenV0, "getBuiltinErc20ByTypeHash").returns({ address: "" } as any);
    sinon.stub(lightGodwokenV0, "getErc20Balance").returns(Promise.resolve("0x6c5db2a4d815dc0000"));
    const eventEmitter = { emit: jest.fn() };
    let errMsg = "";
    try {
      await lightGodwokenV0.generateRawWithdrawalRequest(eventEmitter as any, {
        capacity: "0x2e90edd000",
        amount: "0x6c6b935b8bbd400000",
        sudt_script_hash: erc20Address,
      });
    } catch (error) {
      errMsg = (error as any).message;
    }
    expect(errMsg).toEqual("Godwoken Erc20 balance 1999000000000000000000 is less than 2000000000000000000000");
  });
});
