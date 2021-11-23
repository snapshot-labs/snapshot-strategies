import fetch from 'cross-fetch';
import { subgraphRequest } from '../../utils';

export const author = 'tomyumswap';
export const version = '0.0.1';

type VotingResponse = {
  verificationHash: string;
  block: number;
  tomYumBalance: string;
  tomYumVaultBalance: string;
  tomYumPoolBalance: string;
  tomYumBnbLpBalance: string;
  poolsBalance: string;
  total: string;
};

const MINIMUM_VOTING_POWER = 0.01;
const SMART_CHEF_URL =
  'https://api.thegraph.com/subgraphs/name/tomyumswap/smartchef';
const VOTING_API_URL = 'http://voting-api.tomyumswap.com/api/';

/**
 * Fetches voting power of one address
 */
// const fetchVotingPower = async (
//   address: string,
//   block: number,
//   poolAddresses: string[]
// ): Promise<VotingResponse> => {
//   const response = await fetch(`${VOTING_API_URL}power`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({
//       block,
//       address,
//       poolAddresses
//     })
//   });

//   const payload = await response.json();
//   return payload.data;
// };

/**
 * Fetches voting power of multiple addresses
 */
const fetchVotingPowerMultiple = async (
  addresses: string[],
  block: number,
  poolAddresses: string[]
): Promise<VotingResponse[]> => {
  const response = await fetch(`${VOTING_API_URL}powerV2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      block,
      addresses,
      poolAddresses
    })
  });

  const payload = await response.json();

  return payload.data;
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag =
    typeof snapshot === 'number' ? snapshot : await provider.getBlockNumber();

  const params = {
    smartChefs: {
      __args: {
        where: {
          startBlock_lte: blockTag,
          endBlock_gte: blockTag
        },
        first: 1000,
        orderBy: 'block',
        orderDirection: 'desc'
      },
      id: true,
      startBlock: true,
      endBlock: true
    }
  };

  const results = await subgraphRequest(SMART_CHEF_URL, params);

  if (!results) {
    return;
  }

  try {
    const poolAddresses = results.smartChefs.map((pool) => pool.id);
    const votingPowerResult = await fetchVotingPowerMultiple(
      addresses,
      blockTag,
      poolAddresses
    );

    const calculatedPower = votingPowerResult.reduce(
      (accum, response, index) => {
        const address = addresses[index];
        const total = parseFloat(response.total);

        return {
          ...accum[index],
          [address]:
            total <= MINIMUM_VOTING_POWER ? MINIMUM_VOTING_POWER : total
        };
      },
      {}
    );

    return calculatedPower;
  } catch {
    return [];
  }
}
