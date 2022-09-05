import LightGodwokenV0 from "../LightGodwokenV0";
import LightGodwokenV1 from "../LightGodwokenV1";
import LightGodwokenProvider from "../lightGodwokenProvider";
import { EthereumProvider } from "../ethereumProvider";
import { LightGodwokenConfigMap } from "../config";
import { testConfig } from "./clientConfig";
import { providers } from "ethers";

export const lightGodwokenVersionMap = {
  v0: LightGodwokenV0,
  v1: LightGodwokenV1,
};

type LightGodwokenVersionMap = typeof lightGodwokenVersionMap;

export function createLightGodwoken<T extends keyof typeof lightGodwokenVersionMap>(
  ethAddress: string,
  network: string,
  version: T,
  configMap?: LightGodwokenConfigMap,
): InstanceType<LightGodwokenVersionMap[T]> {
  const ethereum = createDummyLightGodwokenProvider();
  const provider = new LightGodwokenProvider(ethAddress, ethereum, network, version, configMap || testConfig);

  const Callable = lightGodwokenVersionMap[version];
  return new Callable(provider) as InstanceType<LightGodwokenVersionMap[T]>;
}

export function createDummyLightGodwokenProvider() {
  return EthereumProvider.fromWeb3({
    isMetaMask: true,
    isStatus: true,
    host: "",
    path: "",
    on: () => {},
    send: () => {},
    request: () => {},
  } as unknown as providers.ExternalProvider);
}
