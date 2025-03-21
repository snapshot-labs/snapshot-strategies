import { customFetch } from '../../utils';

interface ApiReturn {
  voteWeight: string[];
}

export const author = 'iotex';
export const version = '0.0.2';

const testNetUrl = 'https://analyser-api.testnet.iotex.io';
const mainNetUrl = 'https://analyser-api.iotex.io';

function getUrl(network) {
  return network == 4689 ? mainNetUrl : testNetUrl;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const height = typeof snapshot === 'number' ? snapshot : 10000000000;
  const apiUrl = getUrl(network);
  const response = await customFetch(
    `${apiUrl}/api.StakingService.VoteByHeight`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address: addresses,
        height
      })
    }
  );

  const ret: ApiReturn = await response.json();
  return Object.fromEntries(
    ret.voteWeight.map((v, i) => [addresses[i], parseFloat(v)])
  );
}
