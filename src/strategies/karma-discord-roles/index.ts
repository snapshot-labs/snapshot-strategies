import fetch from 'cross-fetch';
import { getAddress } from '@ethersproject/address';

export const author = 'show-karma';
export const version = '1.0.0';

const KARMA_API = 'https://api.karmahq.xyz/api/dao/discordUsers';

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

  const response = await fetch(`${KARMA_API}/${name}/${roles.join(',')}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });

  const parsedResponse = !response.ok ? [] : await response.json();
  const delegates = parsedResponse.data?.delegates || [];

  const votingPower = {};

  const userAddresses = delegates.map((user) => user.publicAddress);
  const paramAddresses = addresses.length ? addresses : [];
  const allAddresses = [...userAddresses, ...paramAddresses];

  allAddresses.forEach((address) => {
    const checksumAddress = getAddress(address);
    votingPower[checksumAddress] = 1;
  });

  return votingPower;
}
