import { getAddress } from '@ethersproject/address';
// import { formatUnits } from '@ethersproject/units';
import { customFetch } from '../../utils';

export const author = 'SynFutures';
export const version = '0.0.1';

const DEFAULT_BACKEND_URL =
  'https://api.synfutures.com/v3/odyssey/dev/user/usersVotingPower';

export async function strategy(
  space,
  network,
  provider,
  addresses: string[],
  options = { api: DEFAULT_BACKEND_URL },
  snapshot: number | string
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const requestBody = {
    addresses,
    blockTag
  };

  const response = await customFetch(options.api, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();

  return Object.fromEntries(
    data.data.map((value) => [
      getAddress(value.address),
      parseFloat(value.votingPower)
    ])
  );
}
