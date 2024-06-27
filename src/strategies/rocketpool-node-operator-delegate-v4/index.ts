import fetch from 'cross-fetch';
import { getAddress } from '@ethersproject/address';

export const author = 'rocket-pool';
export const version = '0.1.4';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  console.log(blockTag);

  const req = await fetch(
    'https://api.rocketpool.net/mainnet/delegates/block/' + blockTag
  );
  const resp = await req.json();

  const reduced: Record<string, number> = resp.reduce((acc, obj) => {
    const address = getAddress(obj.address);
    if (addresses.includes(address)) {
      if (obj.delegators.length > 0) {
        acc[address] = obj.votingPower;
      } else {
        acc[address] = '0';
      }
    }
    return acc;
  }, {});

  return Object.fromEntries(
    Object.entries(reduced).map(([address, votePower]) => [
      address,
      parseFloat(String(votePower))
    ])
  );
}
