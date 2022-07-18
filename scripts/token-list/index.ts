/**
 * RFC: Universal Asset Notation
 * https://github.com/nervosnetwork/rfcs/pull/335
 */
type LightGodwokenTokenType = {
  id: number;
  symbol: string;
  name: string;
  decimals: number;
  tokenURI: string;
  address: string;
  l1LockArgs: string;
  layer1UAN?: string;
  layer2UAN?: string;
  layer1DisplayName?: string;
  layer2DisplayName?: string;
};

// Get ForceBridge uan-token-list
async function main() {
  // https://raw.githubusercontent.com/nervosnetwork/force-bridge/20f25902d2f86e54585881b53c62a5ec42da5e1a/configs/uan-token-list.json
  const forceBridgeTokenList = require("./uan-token-list.json");
  // https://raw.githubusercontent.com/nervosnetwork/godwoken-info/rfc-uan/mainnet_v0/ERC20TokenList.json
  let gwBridgedTokenList = require("./bridged-token-list-v0.json");
  // // https://raw.githubusercontent.com/nervosnetwork/godwoken-info/rfc-uan/mainnet_v1/bridged-token-list.json
  // let gwBridgedTokenList = require('./bridged-token-list-v1.json');
  let sudtMap = new Map();
  forceBridgeTokenList.forEach((token) => sudtMap.set(token.sudtArgs, token));

  let result: LightGodwokenTokenType[] = [];

  gwBridgedTokenList.forEach((token) => {
    const godwokenBridgeToken: LightGodwokenTokenType = {
      id: 0,
      symbol: token.info.symbol,
      name: token.info.name,
      decimals: token.info.decimals,
      tokenURI: "https://cryptologos.cc/logos/nervos-network-ckb-logo.svg?v=002",
      address: token.erc20Info.ethAddress,
      l1LockArgs: token.erc20Info.sudtScriptArgs,
    };
    if (sudtMap.has(token.erc20Info.sudtScriptArgs)) {
      const uan = sudtMap.get(token.erc20Info.sudtScriptArgs).uanInfo.bridgedUan;
      godwokenBridgeToken.layer1UAN = uan;
      godwokenBridgeToken.layer2UAN = uan.replace(".ckb", ".gw|gw.ckb");
      godwokenBridgeToken.layer1DisplayName = sudtMap.get(token.erc20Info.sudtScriptArgs).uanInfo.bridgedDisplayName;
      godwokenBridgeToken.layer2DisplayName = sudtMap
        .get(token.erc20Info.sudtScriptArgs)
        .uanInfo.bridgedDisplayName.replace("via Forcebridge", "via Forcebridge and Godwoken Bridge");
      godwokenBridgeToken.tokenURI = sudtMap.get(token.erc20Info.sudtScriptArgs).logoURI;
    }
    result.push(godwokenBridgeToken);
  });

  console.log(result);
}

main();
