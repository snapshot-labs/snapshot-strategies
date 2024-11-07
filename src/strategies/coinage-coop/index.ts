import fetch from 'cross-fetch';

export const author = 'isaac-martin';
export const version = '1.0.0';

type Wallet = `0x${string}`;
const COINAGE_COOP_MEMBERS_API_URL = 'https://coinage.media/coop/api/members';

/**
 * Fetches all active coinage coop members
 */
const fetchActiveUsers = async (): Promise<Array<Wallet>> => {
  const response = await fetch(COINAGE_COOP_MEMBERS_API_URL, {
    method: 'GET'
  });

  const payload = await response.json();
  return payload.data;
};

export async function strategy(space, network, provider, addresses) {
  const calculated: Array<[Wallet, number]> = [];

  try {
    const activeMembers = await fetchActiveUsers();
    addresses.forEach((address) => {
      if (activeMembers.includes(address)) {
        calculated.push([address, 1]);
      }
    });

    return Object.fromEntries(calculated);
  } catch (e) {
    console.error('error', e);
  }
}
