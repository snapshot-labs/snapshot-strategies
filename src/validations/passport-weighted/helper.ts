import DIDKit from '@spruceid/didkit-wasm-node/didkit_wasm';
import { Tulons } from 'tulons';

const CERAMIC_URL = 'https://ceramic.passport-iam.gitcoin.co';
const CERAMIC_NETWORK_ID = 1;

export const getPassport = async (address) => {
  // Ceramic connection details

  // Ceramic definition ids on the Ceramic account model
  const CERAMIC_GITCOIN_PASSPORT_STREAM_ID =
    'kjzl6cwe1jw148h1e14jb5fkf55xmqhmyorp29r9cq356c7ou74ulowf8czjlzs';
  const tulons = new Tulons(CERAMIC_URL, CERAMIC_NETWORK_ID);

  // Ceramic data is stored as address -> DID -> Genesis/IDX Stream -> Data Stream
  const { streams } = await tulons.getGenesis(address);
  if (streams[CERAMIC_GITCOIN_PASSPORT_STREAM_ID]) {
    return await tulons.getHydrated(
      await tulons.getStream(streams[CERAMIC_GITCOIN_PASSPORT_STREAM_ID])
    );
  }
  return false;
};

export const getVerifiedStamps = async (
  passport,
  address,
  stampsRequired
): Promise<any[]> => {
  const stamps = passport.stamps || [];

  // filter out stamps with stampsRequired
  const stampsFiltered = stamps.filter((stamp) =>
    stampsRequired.map((a) => a.id).includes(stamp.provider)
  );

  // verify stamps
  let stampsVerified = await Promise.all(
    stampsFiltered.map(async (stamp) => verifyStamp(stamp, address))
  );
  stampsVerified = stampsVerified.filter((s) => s.verified);
  return stampsVerified;
};

const verifyStamp = async (stamp, address) => {
  // given the stamp exists...
  if (stamp) {
    stamp.verified = true;
    const stampAddress = stamp.credential.credentialSubject.id
      .replace(`did:pkh:eip155:${CERAMIC_NETWORK_ID}:`, '')
      .toLowerCase();

    stamp.verified =
      stampAddress !== address.toLowerCase() ? false : stamp.verified;

    // finally verify that the credential verifies with DIDKit
    if (stamp.verified) {
      stamp.verified = await verifyCredential(stamp.credential);
    }
  }

  return stamp;
};

const verifyCredential = async (credential) => {
  const { expirationDate, proof } = credential;

  // check that the credential is still valid (not expired)
  if (new Date(expirationDate) > new Date()) {
    try {
      const verify = JSON.parse(
        await DIDKit.verifyCredential(
          JSON.stringify(credential),
          `{"proofPurpose":"${proof.proofPurpose}"}`
        )
      ) as { checks: string[]; warnings: string[]; errors: string[] };
      return verify.errors.length === 0;
    } catch (e) {
      return false;
    }
  }
  return false;
};

export const hasValidIssuanceAndExpiration = (credential, proposalTs) => {
  const issuanceDate = Number(
    new Date(credential.issuanceDate).getTime() / 1000
  ).toFixed(0);
  const expirationDate = Number(
    new Date(credential.expirationDate).getTime() / 1000
  ).toFixed(0);
  if (issuanceDate <= proposalTs && expirationDate >= proposalTs) {
    return true;
  }
  return false;
};
