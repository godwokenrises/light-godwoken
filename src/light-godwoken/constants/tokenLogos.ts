export type TokenLogo = {
  symbol: string;
  logoURI: string;
};

// grabed from https://github.com/nervosnetwork/force-bridge/blob/main/configs/all-bridged-tokens.json
export const TOKEN_LOGOS = [
  {
    symbol: "ETH|eth",
    logoURI: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=002",
  },
  {
    symbol: "USDT|eth",
    logoURI: "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=002",
  },
  {
    symbol: "DAI|eth",
    logoURI: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.svg?v=002",
  },
  {
    symbol: "LINK|eth",
    logoURI: "https://cryptologos.cc/logos/chainlink-link-logo.svg?v=002",
  },
  {
    symbol: "WBTC|eth",
    logoURI: "https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.svg?v=002",
  },
  {
    symbol: "BAND|eth",
    logoURI: "https://cryptologos.cc/logos/band-protocol-band-logo.svg?v=013",
  },
  {
    symbol: "BAT|eth",
    logoURI: "https://cryptologos.cc/logos/basic-attention-token-bat-logo.svg?v=002",
  },
  {
    symbol: "SNX|eth",
    logoURI: "https://cryptologos.cc/logos/synthetix-network-token-snx-logo.svg?v=002",
  },
  {
    symbol: "UNI|eth",
    logoURI: "https://cryptologos.cc/logos/uniswap-uni-logo.svg?v=013",
  },
  {
    symbol: "YFI|eth",
    logoURI: "https://cryptologos.cc/logos/yearn-finance-yfi-logo.svg?v=013",
  },
  {
    symbol: "BUSD|eth",
    logoURI: "https://cryptologos.cc/logos/binance-usd-busd-logo.svg?v=002",
  },
  {
    symbol: "COMP|eth",
    logoURI: "https://cryptologos.cc/logos/compound-comp-logo.svg?v=013",
  },
  {
    symbol: "MKR|eth",
    logoURI: "https://cryptologos.cc/logos/maker-mkr-logo.svg?v=002",
  },
  {
    symbol: "IOTX|eth",
    logoURI: "https://cryptologos.cc/logos/iotex-iotx-logo.svg?v=002",
  },
  {
    symbol: "BEL|eth",
    logoURI: "https://cryptologos.cc/logos/belacoin-bela-logo.svg?v=013",
  },
  {
    symbol: "USDP|eth",
    logoURI: "https://cryptologos.cc/logos/paxos-standard-pax-logo.svg?v=002",
  },
  {
    symbol: "USDC|eth",
    logoURI: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=002",
  },
  {
    symbol: "SXP|eth",
    logoURI: "https://cryptologos.cc/logos/swipe-sxp-logo.svg?v=002",
  },
  {
    symbol: "SUSHI|eth",
    logoURI: "https://cryptologos.cc/logos/sushiswap-sushi-logo.svg?v=013",
  },
  {
    symbol: "AAVE|eth",
    logoURI: "https://cryptologos.cc/logos/aave-aave-logo.svg?v=013",
  },
  {
    symbol: "1INCH|eth",
    logoURI: "https://cryptologos.cc/logos/1inch-1inch-logo.svg?v=013",
  },
  {
    symbol: "LTO|eth",
    logoURI: "https://cryptologos.cc/logos/lto-network-lto-logo.svg?v=002",
  },
  {
    symbol: "MATIC|eth",
    logoURI: "https://cryptologos.cc/logos/matic-network-matic-logo.svg?v=002",
  },
  {
    symbol: "BNT|eth",
    logoURI: "https://cryptologos.cc/logos/bancor-bnt-logo.svg?v=002",
  },
  {
    symbol: "BZRX|eth",
    logoURI: "https://cryptologos.cc/logos/bzx-protocol-bzrx-logo.svg?v=013",
  },
  {
    symbol: "MDT|eth",
    logoURI: "https://cryptologos.cc/logos/measurable-data-token-mdt-logo.svg?v=013",
  },
  {
    symbol: "PNT|eth",
    logoURI: "https://cryptologos.cc/logos/pnetwork-pnt-logo.svg?v=013",
  },
  {
    symbol: "PERL|eth",
    logoURI: "https://cryptologos.cc/logos/perlin-perl-logo.svg?v=002",
  },
  {
    symbol: "BAL|eth",
    logoURI: "https://cryptologos.cc/logos/balancer-bal-logo.svg?v=013",
  },
  {
    symbol: "BLZ|eth",
    logoURI: "https://cryptologos.cc/logos/bluzelle-blz-logo.svg?v=002",
  },
  {
    symbol: "COTI|eth",
    logoURI: "https://cryptologos.cc/logos/coti-coti-logo.svg?v=013",
  },
  {
    symbol: "TRX|eth",
    logoURI: "https://cryptologos.cc/logos/tron-trx-logo.svg?v=002",
  },
  {
    symbol: "TUSD|eth",
    logoURI: "https://cryptologos.cc/logos/trueusd-tusd-logo.svg?v=002",
  },
  {
    symbol: "BNB|bsc",
    logoURI: "https://cryptologos.cc/logos/binance-coin-bnb-logo.svg?v=002",
  },
  {
    symbol: "BUSD|bsc",
    logoURI: "https://cryptologos.cc/logos/binance-usd-busd-logo.svg?v=002",
  },
  {
    symbol: "USDT|bsc",
    logoURI: "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=002",
  },
  {
    symbol: "ETH|bsc",
    logoURI: "https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=002",
  },
  {
    symbol: "ADA|bsc",
    logoURI: "https://cryptologos.cc/logos/cardano-ada-logo.svg?v=002",
  },
  {
    symbol: "BTCB|bsc",
    logoURI: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=002",
  },
  {
    symbol: "WBNB|bsc",
    logoURI: "https://cryptologos.cc/logos/binance-coin-bnb-logo.svg?v=002",
  },
  {
    symbol: "USDC|bsc",
    logoURI: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=002",
  },
  {
    symbol: "iBFR|bsc",
    logoURI: "https://assets.coingecko.com/coins/images/18540/large/buffer.png",
  },
  {
    symbol: "SFP|bsc",
    logoURI: "https://cryptologos.cc/logos/safepal-sfp-logo.svg?v=017",
  },
];

export const TOKEN_LOGOS_MAP: Record<string, string> = TOKEN_LOGOS.reduce((previousValue, currentValue) => {
  return Object.assign(previousValue, { [currentValue.symbol]: currentValue.logoURI });
}, {});
