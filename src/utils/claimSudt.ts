import { AcpTransferSudtBuilder, CkitProvider, predefined } from "@ckitjs/ckit";
import {
  SUDT as PWSUDT,
  RawProvider as PWRawProvider,
  DefaultSigner as PWDefaultSigner,
  transformers as PWTransformers,
  SnakeScript,
  HashType,
} from "@lay2/pw-core";
import { Transaction as LumosTransaction } from "@ckb-lumos/base";

const usdcInfo = {
  name: "Nervos-Peg USD Coin",
  symbol: "USDC",
  decimals: 18,
};
const REACT_APP_CKB_USDC_ISSUER_LOCK_HASH = "0x58bef38794236b315b7c23fd8132d7f42676228d659b291936e8c6c7ba9f064e";
const REACT_APP_CKB_USDC_ISSUER_PRIVATE_KEY = "0xb60bf0787fa97c52bb62d41131757954d5bda2f2054fb0c5efa172fa6b945296";
const REACT_APP_CKB_SUDT_SCRIPT_CODE_HASH = "0x5e7a36a77e68eecc013dfa2fe6a23f3b6c344b04005808694ae6dd45eea4cfd5";
const REACT_APP_CKB_SUDT_SCRIPT_HASH_TYPE: HashType = "type" as HashType;

export function generateLayer1SUDTTypeScript(args: string): SnakeScript {
  return {
    code_hash: REACT_APP_CKB_SUDT_SCRIPT_CODE_HASH,
    hash_type: REACT_APP_CKB_SUDT_SCRIPT_HASH_TYPE,
    args,
  };
}
export const claim = async () => {
  const ckitProvider = new CkitProvider("https://mainnet.ckb.dev/indexer", "https://mainnet.ckb.dev/rpc");
  await ckitProvider.init(predefined.Aggron);
  const usdcIssuerProvider = new PWRawProvider(REACT_APP_CKB_USDC_ISSUER_PRIVATE_KEY);
  usdcIssuerProvider.init();
  const usdcIssuerSinger = new PWDefaultSigner(usdcIssuerProvider);
  const usdc = new PWSUDT(REACT_APP_CKB_USDC_ISSUER_LOCK_HASH, usdcInfo);
  const builder = new AcpTransferSudtBuilder(
    {
      recipients: [
        {
          recipient:
            "ckt1q3uljza4azfdsrwjzdpea6442yfqadqhv7yzfu5zknlmtusm45hpuqdq30xrnzz5md82llvu9zugr3jlj8369zcqukqgnj",
          amount: "10000000000",
          policy: "createCell",
          sudt: generateLayer1SUDTTypeScript(usdc.issuerLockHash),
        },
      ],
    },
    ckitProvider,
    usdcIssuerProvider.address.addressString,
  );

  const txToSign = await builder.build();
  const signedPWTx = await usdcIssuerSinger.sign(txToSign as any);
  const signedTx = PWTransformers.TransformTransaction(signedPWTx) as LumosTransaction;
  const innerTxHash = await ckitProvider.sendTransaction(signedTx);
  console.log(innerTxHash);
};
