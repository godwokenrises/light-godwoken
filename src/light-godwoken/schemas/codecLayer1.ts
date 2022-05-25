import { molecule, number, blockchain } from "@ckb-lumos/codec/";
import { HexString } from "@ckb-lumos/lumos";

const { table, option, vector, array } = molecule;
const { Bytes } = blockchain;
const { Uint8 } = number;

// vector SmtProof <byte>;

// table SmtProofEntry {
//     mask: byte,
//     proof: SmtProof,
// }

// vector SmtProofEntryVec <SmtProofEntry>;
// array Auth[byte; 21];

// table Identity {
//     identity: Auth,
//     proofs: SmtProofEntryVec,
// }
// option IdentityOpt (Identity);

// table OmniLockWitnessLock {
//     signature: BytesOpt,
//     omni_identity: IdentityOpt,
//     preimage: BytesOpt,
// }

export type OmniLockWitnessLock = {
  signature?: HexString;
  omni_identity?: {
    identity: HexString;
    proofs: {
      mask: number;
      proof: HexString[];
    }[];
  };
  preimage?: HexString;
};
export const OmniLockWitnessLockCodec = table(
  {
    signature: option(Bytes),
    omni_identity: option(
      table(
        {
          identity: array(Uint8, 21),
          proofs: vector(
            table(
              {
                mask: Uint8,
                proof: vector(Uint8),
              },
              ["mask", "proof"],
            ),
          ),
        },
        ["identity", "proofs"],
      ),
    ),
    preimage: option(Bytes),
  },
  ["signature", "omni_identity", "preimage"],
);
