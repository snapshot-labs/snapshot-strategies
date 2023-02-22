import fetch from 'cross-fetch';

const CERAMIC_NETWORK_ID = 1;

export const getPassport = async (address) => {
  const res = await fetch(
    `https://api.scorer.gitcoin.co/ceramic-cache/stamp?address=${address}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  const result = await res.json();
  if (!result.stamps || typeof result.stamps !== 'object')
    throw new Error('Invalid stamps');
  return {
    stamps: result.stamps
  };
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

const verifyStamp = async ({ stamp, provider }, address) => {
  stamp.provider = provider;
  // given the stamp exists...
  if (stamp) {
    stamp.verified = true;
    const stampAddress = stamp.credentialSubject.id
      .replace(`did:pkh:eip155:${CERAMIC_NETWORK_ID}:`, '')
      .toLowerCase();

    stamp.verified =
      stampAddress !== address.toLowerCase() ? false : stamp.verified;
  }

  return stamp;
};

export const hasValidIssuanceAndExpiration = (stamp, proposalTs) => {
  const issuanceDate = Number(
    new Date(stamp.issuanceDate).getTime() / 1000
  ).toFixed(0);
  const expirationDate = Number(
    new Date(stamp.expirationDate).getTime() / 1000
  ).toFixed(0);
  if (issuanceDate <= proposalTs && expirationDate >= proposalTs) {
    return true;
  }
  return false;
};
