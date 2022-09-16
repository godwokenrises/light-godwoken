import { providers } from "ethers";
import {
  EthereumProvider,
  GodwokenVersion,
  GodwokenNetwork,
  LightGodwokenProvider,
  LightGodwokenV0,
  LightGodwokenV1,
} from "light-godwoken";

export function createEthereumProvider(ethereum: providers.ExternalProvider) {
  return EthereumProvider.fromWeb3(ethereum);
}

export function createLightGodwokenV0(
  account: string,
  network: GodwokenNetwork | string,
  ethereum: providers.ExternalProvider,
) {
  const provider = new LightGodwokenProvider({
    ethereum: createEthereumProvider(ethereum),
    ethAddress: account,
    network,
    version: GodwokenVersion.V0,
  });
  return new LightGodwokenV0(provider);
}

export function createLightGodwokenV1(
  account: string,
  network: GodwokenNetwork | string,
  ethereum: providers.ExternalProvider,
) {
  const provider = new LightGodwokenProvider({
    ethereum: createEthereumProvider(ethereum),
    ethAddress: account,
    network,
    version: GodwokenVersion.V1,
  });
  return new LightGodwokenV1(provider);
}
