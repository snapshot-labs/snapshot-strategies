import fetch from 'cross-fetch';
import { getAddress } from '@ethersproject/address';

export const author = 'KarmaHq';
export const version = '0.0.1';

const KARMA_API = 'https://api.karmahq.xyz/api/dao/discordUsers';

export async function strategy(options): Promise<Record<string, number>> {
  const { discordId, roles } = options;

  const response = await fetch(`${KARMA_API}/${discordId}/${roles.join(',')}`);

  if (response.status >= 400) {
    throw new Error('Bad response from server');
  }

  const { data } = await response.json();

  const votingPower: Record<string, number> = {};

  data.delegates?.forEach((user) => {
    const checksumAddress = getAddress(user.publicAddress);
    votingPower[checksumAddress] = 1;
  });

  return votingPower;
}

(async () => await strategy({ discordId: 'apecoin', roles: ['assembly'] }))();
