import { molecule, number } from "@ckb-lumos/codec";
import { blockchain } from "@ckb-lumos/base";
import { HexString } from "@ckb-lumos/lumos";

const { table, option, vector, array } = molecule;
const { Bytes } = blockchain;
const { Uint8 } = number;

// vector SmtProof <byte>;
const SmtProofCodec = vector(Uint8);

// table SmtProofEntry {
//     mask: byte,
//     proof: SmtProof,
// }
const SmtProofEntryCodec = table(
  {
    mask: Uint8,
    proof: SmtProofCodec,
  },
  ["mask", "proof"],
);

// vector SmtProofEntryVec <SmtProofEntry>;
const SmtProofEntryVecCodec = vector(SmtProofEntryCodec);

// array Auth[byte; 21];
const AuthCodec = array(Uint8, 21);

// table Identity {
//     identity: Auth,
//     proofs: SmtProofEntryVec,
// }
const IdentityCodec = table(
  {
    identity: AuthCodec,
    proofs: SmtProofEntryVecCodec,
  },
  ["identity", "proofs"],
);

// option IdentityOpt (Identity);
const IdentityOptCodec = option(IdentityCodec);

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
    omni_identity: IdentityOptCodec,
    preimage: option(Bytes),
  },
  ["signature", "omni_identity", "preimage"],
);
