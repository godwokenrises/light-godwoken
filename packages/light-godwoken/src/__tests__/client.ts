import LightGodwokenV0 from "../LightGodwokenV0";
import LightGodwokenV1 from "../LightGodwokenV1";
import LightGodwokenProvider from "../lightGodwokenProvider";
import { EthereumProvider } from "../ethereumProvider";
import { GodwokenVersion, LightGodwokenConfig } from "../config";
import { testConfig } from "./clientConfig";
import { providers } from "ethers";

export const lightGodwokenVersionMap = {
  [GodwokenVersion.V0]: LightGodwokenV0,
  [GodwokenVersion.V1]: LightGodwokenV1,
};

type LightGodwokenVersionMap = typeof lightGodwokenVersionMap;

export function createLightGodwoken<T extends keyof LightGodwokenVersionMap>(
  ethAddress: string,
  network: string,
  version: T,
  config?: LightGodwokenConfig,
): InstanceType<LightGodwokenVersionMap[T]> {
  const ethereum = createDummyLightGodwokenProvider();
  const provider = new LightGodwokenProvider({
    ethAddress,
    ethereum,
    network,
    version,
    config: config || testConfig[version],
  });

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
