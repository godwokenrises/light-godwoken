/**
 * Proposal RFC: Universal Asset Notation
 * https://github.com/nervosnetwork/rfcs/blob/c47994f/rfcs/0000-universal-asset-notation/0000-universal-asset-notation.md
 */
type UAN = {
  asset: { assetSymbol: string; chainSymbol: string };
  route: Array<{ bridgeSymbol: string; chainSymbol: string }>;
};

const defaultChains: Record<string, string> = {
  // gw: "Godwoken",
  ckb: "CKB",
  eth: "Ethereum",
  bsc: "BSC",
};
const defaultBridges: Record<string, string> = {
  // gb: "Godwoken Bridge",
  fb: "Force Bridge",
};

const UAN_REGEX = /^(\w+\.\w+)(\|\w+\.\w+)*$/;

export function parse(uan: string): UAN {
  if (!UAN_REGEX.test(uan)) throw new Error("Invalid UAN: " + uan);

  const [assetPart, ...pathsPart] = uan.split("|");
  const [assetSymbol, assetChainSymbol] = assetPart.split(".");

  const route = pathsPart.map((path) => {
    const [bridgeSymbol, chainSymbol] = path.split(".");
    return { bridgeSymbol, chainSymbol };
  });

  return {
    asset: { assetSymbol, chainSymbol: assetChainSymbol },
    route: route,
  };
}

/**
 *
 * @param uan UAN or UAN string
 * @param mapping bridges and chains to translate, by default use {defaultBridges} and {defaultChains}
 * @returns human-readable uan
 */
export function translate(
  uan: string | UAN,
  mapping: { bridges: Record<string, string>; chains: Record<string, string> } = {
    bridges: defaultBridges,
    chains: defaultChains,
  },
): string {
  const { asset, route } = typeof uan === "string" ? parse(uan) : uan;
  const { bridges, chains } = mapping;

  const filteredRoutes = route.filter(({ chainSymbol, bridgeSymbol }) => bridges[bridgeSymbol] && chains[chainSymbol]);

  let routeDisplayName = filteredRoutes
    .map(({ chainSymbol, bridgeSymbol }) => `${bridges[bridgeSymbol]} from ${chains[chainSymbol]}`)
    .join(" and ");

  routeDisplayName = routeDisplayName ? `(via ${routeDisplayName})` : "";

  return `${asset.assetSymbol}${routeDisplayName}`;
}
