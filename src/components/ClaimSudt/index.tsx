import { CkitProvider, MintOptions, MintSudtBuilder, predefined } from "@ckitjs/ckit";
import { Secp256k1Signer } from "@ckitjs/ckit/dist/wallets/Secp256k1Wallet";
import { notification } from "antd";
import { useLightGodwoken } from "../../hooks/useLightGodwoken";
import Link from "antd/lib/typography/Link";
import { BI } from "@ckb-lumos/lumos";
import { CKB_INDEXER_URL, CKB_RPC_URL, CKB_USDC_ISSUER_PRIVATE_KEY } from "../../config";

const claim = async (recipientAddr: string) => {
  const provider = new CkitProvider(CKB_INDEXER_URL, CKB_RPC_URL);
  await provider.init(predefined.Aggron);

  const { SECP256K1_BLAKE160 } = provider.config.SCRIPTS;
  const issuerSigner = new Secp256k1Signer(CKB_USDC_ISSUER_PRIVATE_KEY, provider, {
    code_hash: SECP256K1_BLAKE160.CODE_HASH,
    hash_type: SECP256K1_BLAKE160.HASH_TYPE,
  });

  const recipients: MintOptions["recipients"] = [
    {
      recipient: recipientAddr,
      additionalCapacity: "0",
      amount: BI.from(1000).mul(BI.from(10).pow(18)).toString(),
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
      throw new Error("LightGodwoken Not Found!");
    }
    const txHash = await claim(lightGodwoken.provider.l1Address);
    notification.success({ message: `deposit Tx(${txHash}) is successful` });
  };
  return <Link onClick={claimSudt}>Claim SUDT</Link>;
};
