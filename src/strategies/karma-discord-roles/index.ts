import fetch from 'cross-fetch';
import { getAddress } from '@ethersproject/address';

export const author = 'KarmaHq';
export const version = '0.0.1';

const KARMA_API = 'https://api.karmahq.xyz/api/dao/discordUsers';

export async function strategy(
  options: any,
  addresses: any
): Promise<Record<string, number>> {
  const { name, roles } = options;

  const response = await fetch(`${KARMA_API}/${name}/${roles.join(',')}`);

  const { data } = await response.json();

  const votingPower: Record<string, number> = {};

  const userAddresses = data.delegates.map((user) => user.publicAddress);

  [...addresses, userAddresses].forEach((address) => {
    const checksumAddress = getAddress(address);
    votingPower[checksumAddress] = 1;
  });

  return votingPower;
}
