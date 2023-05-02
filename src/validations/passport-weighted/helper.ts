import DIDKit from '@spruceid/didkit-wasm-node/didkit_wasm';
import { Tulons } from 'tulons';
import fetch from 'cross-fetch';

const CERAMIC_URL = 'https://ceramic.passport-iam.gitcoin.co';
const CERAMIC_NETWORK_ID = 1;
const CERAMIC_GITCOIN_PASSPORT_STREAM_ID =
  'kjzl6cwe1jw148h1e14jb5fkf55xmqhmyorp29r9cq356c7ou74ulowf8czjlzs';
const IAM_ISSUER_DID =
  'did:key:z6MkghvGHLobLEdj1bgRLhS4LPGJAvbMA1tn2zcRyqmYU5LC';

export const getPassport = async (address) => {
  const tulons = new Tulons(CERAMIC_URL, CERAMIC_NETWORK_ID);
  // Ceramic data is stored as address -> DID -> Genesis/IDX Stream -> Data Stream
  const { streams } = await tulons.getGenesis(address);
  if (streams[CERAMIC_GITCOIN_PASSPORT_STREAM_ID]) {
    const passport: any = await tulons.getStream(
      streams[CERAMIC_GITCOIN_PASSPORT_STREAM_ID]
    );
    const streamIDs = passport.stamps.map((ceramicStamp) => {
      return ceramicStamp.credential;
    });
    // `stamps` is stored as ceramic URLs - must load actual VC data from URL
    const stampsToLoad = passport.stamps.map(async (_stamp, idx) => {
      const streamUrl = `${CERAMIC_URL}/api/v0/streams/${streamIDs[
        idx
      ].substring(10)}`;
      const response = await fetch(streamUrl);
      const loadedCred = await response.json();
      const { provider } = _stamp;

      return {
        provider,
        credential: loadedCred.state.content,
        streamId: streamIDs[idx]
      };
    });
    // load all the stamps (unlike gitcoin UI, not ignoring any failing stamps)
    const stamps = await Promise.all(stampsToLoad);

    return {
      issuanceDate: new Date(passport.issuanceDate),
      expiryDate: new Date(passport.expiryDate),
      stamps
    };
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
  const { proof } = credential;
  try {
    const verify = JSON.parse(
      await DIDKit.verifyCredential(
        JSON.stringify(credential),
        `{"proofPurpose":"${proof.proofPurpose}"}`
      )
    ) as { checks: string[]; warnings: string[]; errors: string[] };
    const has_correct_issuer = credential.issuer === IAM_ISSUER_DID;
    return verify.errors.length === 0 && has_correct_issuer;
  } catch (e) {
    return false;
  }
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
