import { CkitProvider, MintOptions, MintSudtBuilder, predefined } from "@ckitjs/ckit";
import { SnakeScript, HashType } from "@lay2/pw-core";
import { HexString } from "@ckb-lumos/base";
import { Secp256k1Signer } from "@ckitjs/ckit/dist/wallets/Secp256k1Wallet";
import { notification } from "antd";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import Link from "antd/lib/typography/Link";

const REACT_APP_CKB_USDC_ISSUER_PRIVATE_KEY = "0xb60bf0787fa97c52bb62d41131757954d5bda2f2054fb0c5efa172fa6b945296";
const REACT_APP_CKB_SUDT_SCRIPT_CODE_HASH = "0x5e7a36a77e68eecc013dfa2fe6a23f3b6c344b04005808694ae6dd45eea4cfd5";
const REACT_APP_CKB_SUDT_SCRIPT_HASH_TYPE: HashType = "type" as HashType;

export function randomHexString(lengthWithOut0x: number): HexString {
  return "0x" + [...Array(lengthWithOut0x)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
}

export function generateLayer1SUDTTypeScript(args: string): SnakeScript {
  return {
    code_hash: REACT_APP_CKB_SUDT_SCRIPT_CODE_HASH,
    hash_type: REACT_APP_CKB_SUDT_SCRIPT_HASH_TYPE,
    args,
  };
}

export const claim = async (recipientAddr: string) => {
  const provider = new CkitProvider("https://testnet.ckb.dev/indexer", "https://testnet.ckb.dev/rpc");
  await provider.init(predefined.Aggron);

  const issuerPrivateKey = REACT_APP_CKB_USDC_ISSUER_PRIVATE_KEY;

  const { SECP256K1_BLAKE160 } = provider.config.SCRIPTS;
  const issuerSigner = new Secp256k1Signer(issuerPrivateKey, provider, {
    code_hash: SECP256K1_BLAKE160.CODE_HASH,
    hash_type: SECP256K1_BLAKE160.HASH_TYPE,
  });

  const recipients: MintOptions["recipients"] = [
    {
      recipient: recipientAddr,
      additionalCapacity: Math.ceil(Math.random() * 10 ** 8).toString(),
      amount: BigInt(1000 * 10 ** 18).toString(),
      capacityPolicy: "createCell",
    },
  ];

  const unsigned = await new MintSudtBuilder({ recipients }, provider, await issuerSigner.getAddress()).build();
  const mintTxHash = await provider.sendTransaction(await issuerSigner.seal(unsigned));
  return mintTxHash;
};

export const ClaimSudt: React.FC = () => {
  const lightGodwoken = useLightGodwoken();

  const claimSudt = async () => {
    if (!lightGodwoken) {
      throw new Error();
    }
    const txHash = await claim(lightGodwoken.provider.l1Address);
    notification.success({ message: `deposit Tx(${txHash}) is successful` });
  };
  return <Link onClick={claimSudt}>Claim SUDT</Link>;
};
