import { EventEmitter } from "events";
import sinon from "sinon";
import LightGodwokenV1 from "../LightGodwokenV1";
import LightGodwokenV0 from "../LightGodwokenV0";
import DefaultLightGodwokenProvider from "../lightGodwokenProvider";
import { dummyScriptHash } from "./utils";

let lightGodwokenV0: LightGodwokenV0;
let lightGodwokenV1: LightGodwokenV1;
let lightGodwokenProviderV0: DefaultLightGodwokenProvider;
let lightGodwokenProviderV1: DefaultLightGodwokenProvider;
beforeEach(() => {
  const ethAddress = "0x0C1EfCCa2Bcb65A532274f3eF24c044EF4ab6D73";
  const dummyEthereum = {
    on: () => {},
  };
  lightGodwokenProviderV1 = new DefaultLightGodwokenProvider(ethAddress, dummyEthereum, "v1");
  lightGodwokenV1 = new LightGodwokenV1(lightGodwokenProviderV1);
  lightGodwokenProviderV0 = new DefaultLightGodwokenProvider(ethAddress, dummyEthereum, "v0");
  lightGodwokenV0 = new LightGodwokenV0(lightGodwokenProviderV0);
});

describe("test light godwoken v1 withdrawal", () => {
  it("should generate RawWithdrawalRequest when withdraw 2000 ckb and user balance is 2000", async () => {
    sinon.stub(lightGodwokenV1.godwokenClient, "getBalance").returns(Promise.resolve(BigInt(200000000000)));
    sinon.stub(lightGodwokenV1.godwokenClient, "getAccountIdByScriptHash").returns(Promise.resolve(9));
    sinon.stub(lightGodwokenV1.godwokenClient, "getNonce").returns(Promise.resolve(1));
    sinon.stub(lightGodwokenV1.godwokenClient, "getChainId").returns(Promise.resolve("0x11"));
    const eventEmitter = new EventEmitter();
    const rawWithdrawalRequest = await lightGodwokenV1.generateRawWithdrawalRequest(eventEmitter, {
      capacity: "0x2e90edd000",
      amount: "0x0",
      sudt_script_hash: dummyScriptHash,
    });

    expect(rawWithdrawalRequest).toEqual({
      account_script_hash: "0xfed789f7570d7fe77bb477b6e0b318d44f4f6581aaf5f84ca2b629d5d52876db",
      amount: "0x0",
      capacity: "0x2e90edd000",
      chain_id: "0x11",
      fee: "0x0",
      nonce: "0x1",
      owner_lock_hash: "0x3837aad0e28da55d366d62b7df9b1b0613c39c730c4c409b9722d4bed8cfa926",
      sudt_script_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    });
  });

  it("should throw error when withdraw 2000 ckb and user balance is 1999", async () => {
    sinon.stub(lightGodwokenV1.godwokenClient, "getBalance").returns(Promise.resolve(BigInt(199900000000)));
    sinon.stub(lightGodwokenV1.godwokenClient, "getAccountIdByScriptHash").returns(Promise.resolve(9));
    sinon.stub(lightGodwokenV1.godwokenClient, "getNonce").returns(Promise.resolve(1));
    sinon.stub(lightGodwokenV1.godwokenClient, "getChainId").returns(Promise.resolve("0x11"));
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
    sinon.stub(lightGodwokenV1.godwokenClient, "getBalance").returns(Promise.resolve(BigInt(200000000000)));
    sinon.stub(lightGodwokenV1.godwokenClient, "getAccountIdByScriptHash").returns(Promise.resolve(9));
    sinon.stub(lightGodwokenV1.godwokenClient, "getNonce").returns(Promise.resolve(1));
    sinon.stub(lightGodwokenV1.godwokenClient, "getChainId").returns(Promise.resolve("0x11"));
    sinon.stub(lightGodwokenV1, "getErc20Balance").returns(Promise.resolve("0x6c6b935b8bbd400000"));
    const eventEmitter = new EventEmitter();
    const rawWithdrawalRequest = await lightGodwokenV1.generateRawWithdrawalRequest(eventEmitter, {
      capacity: "0x2e90edd000",
      amount: "0x2e90edd000",
      sudt_script_hash: erc20Address,
    });

    expect(rawWithdrawalRequest).toEqual({
      account_script_hash: "0xfed789f7570d7fe77bb477b6e0b318d44f4f6581aaf5f84ca2b629d5d52876db",
      amount: "0x2e90edd000",
      capacity: "0x2e90edd000",
      chain_id: "0x11",
      fee: "0x0",
      nonce: "0x1",
      owner_lock_hash: "0x3837aad0e28da55d366d62b7df9b1b0613c39c730c4c409b9722d4bed8cfa926",
      sudt_script_hash: erc20Address,
    });
  });
  it("should throw error when withdraw 2000 ckb and 2000 sudt and user balance is 2000 ckb and 1999 sudt", async () => {
    const erc20Address = lightGodwokenV1.getBuiltinErc20List()[0].sudt_script_hash;
    sinon.stub(lightGodwokenV1.godwokenClient, "getBalance").returns(Promise.resolve(BigInt(200000000000)));
    sinon.stub(lightGodwokenV1.godwokenClient, "getAccountIdByScriptHash").returns(Promise.resolve(9));
    sinon.stub(lightGodwokenV1.godwokenClient, "getNonce").returns(Promise.resolve(1));
    sinon.stub(lightGodwokenV1.godwokenClient, "getChainId").returns(Promise.resolve("0x11"));
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
