import fetch from 'cross-fetch';

export const author = 'zorro-project';
export const version = '0.1.0';

const API_URL = 'http://api.zorro.xyz';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const response = await fetch(API_URL + '/getVerifiedExternalAddresses', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      purposeIdentifier: options.purposeIdentifier || space,
      externalAddresses: addresses,
      snapshot
    })
  });
  const { verifiedExternalAddresses } = await response.json();
  const lookup = Object.fromEntries(
    verifiedExternalAddresses.map((addr) => [addr.toLowerCase(), true])
  );
  const power = options.power || 1;
  return Object.fromEntries(
    addresses.map((address) => [
      address,
      lookup[address.toLowerCase()] ? power : 0
    ])
  );
}
