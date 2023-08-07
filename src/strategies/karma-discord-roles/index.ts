import fetch from 'cross-fetch';
import { getAddress } from '@ethersproject/address';

export const author = 'show-karma';
export const version = '1.0.1';

const KARMA_API = 'https://api.karmahq.xyz/api/dao/discord-users';

async function getBlockTimestamp(provider, snapshot) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  let block;
  try {
    block = await provider.getBlock(blockTag);
  } catch (error) {
    throw new Error('Failed to get block information');
  }
  return ((block?.timestamp || 0) * 1000).toString();
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<{
  [k: string]: any;
}> {
  const { name, roles } = options;

  if (!name || !roles) return {};

  const timestamp = await getBlockTimestamp(provider, snapshot);

  const queryParams = new URLSearchParams({
    name,
    roles: roles.join(','),
    timestamp,
    addresses: addresses.join(', ')
  });

  const requestOptions = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  };

  const response = await fetch(`${KARMA_API}?${queryParams}`, requestOptions);

  const parsedResponse = !response.ok ? [] : await response.json();
  const delegates = parsedResponse.data?.delegates || [];

  const votingPower = {};

  addresses.forEach((address: string) => {
    const userExists = delegates.find(
      (delegate) => delegate.publicAddress === address.toLowerCase()
    );
    const checksumAddress = getAddress(address);
    votingPower[checksumAddress] = !!userExists ? 1 : 0;
  });

  return votingPower;
}
