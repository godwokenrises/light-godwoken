import { Signer, TypedDataSigner, ExternallyOwnedAccount } from "@ethersproject/abstract-signer";
import { providers, utils, Wallet } from "ethers";

type ExternalProvider = providers.ExternalProvider;
type AdaptProvider = providers.Web3Provider | providers.JsonRpcProvider;
type AdaptSigner = (Signer & TypedDataSigner) | (Signer & TypedDataSigner & ExternallyOwnedAccount);

type FirstConstructorParameter<T extends { new (...args: any): any }> = NonNullable<ConstructorParameters<T>[0]>;
type FirstJsonRpcProviderParameter = FirstConstructorParameter<typeof providers.JsonRpcProvider>;
type FirstWalletParameter = FirstConstructorParameter<typeof Wallet>;

export interface EthereumProviderBase {
  // Provider & Signer
  readonly provider: AdaptProvider;
  readonly signer: AdaptSigner;

  // Provider request
  send: AdaptProvider["send"];

  // Event emitters
  on: AdaptProvider["on"];
  off: AdaptProvider["off"];

  // Signing
  signMessage: AdaptSigner["signMessage"];
  signTypedData: AdaptSigner["_signTypedData"];
}

export class EthereumProvider implements EthereumProviderBase {
  readonly provider: AdaptProvider;
  readonly signer: AdaptSigner;

  constructor(provider: AdaptProvider, signer: AdaptSigner) {
    this.provider = provider;
    this.signer = signer;
  }

  // Web3Provider
  static fromWeb3(ethereum: ExternalProvider) {
    const provider = new providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    return new EthereumProvider(provider, signer);
  }
  static isWeb3Provider(target: unknown): target is providers.Web3Provider {
    return target instanceof providers.Web3Provider;
  }

  // JsonRpcProvider initiate with private key
  static fromPrivateKey(url: FirstJsonRpcProviderParameter, privateKey: FirstWalletParameter) {
    const provider = new providers.JsonRpcProvider(url);
    const signer = new Wallet(privateKey, provider);
    return new EthereumProvider(provider, signer);
  }

  // Signer methods
  send(...args: Parameters<AdaptProvider["send"]>) {
    const [method, params] = args;
    return this.provider.send(method, params);
  }
  on(...args: Parameters<AdaptProvider["on"]>) {
    return this.provider.on(...args);
  }
  off(...args: Parameters<AdaptProvider["off"]>) {
    return this.provider.off(...args);
  }
  signMessage(message: Parameters<AdaptSigner["signMessage"]>[0]) {
    return this.signer.signMessage(utils.arrayify(message));
  }
  signTypedData(...args: Parameters<AdaptSigner["_signTypedData"]>) {
    return this.signer._signTypedData(...args);
  }

  // External signer methods
  async getAddress() {
    return await this.signer.getAddress();
  }

  // Provider methods
  async getBalance(...args: Parameters<AdaptProvider["getBalance"]>) {
    return await this.provider.getBalance(...args);
  }
}
