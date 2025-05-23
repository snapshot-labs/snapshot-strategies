import { subgraphRequest, customFetch } from '../../utils';

export const author = 'akshaysoam8';
export const version = '0.0.1';

type VotingResponse = {
  verificationHash: string;
  block: number;
  aksBalance: string;
  aksVaultBalance: string;
  aksPoolBalance: string;
  aksBnbLpBalance: string;
  poolsBalance: string;
  total: string;
};

const MINIMUM_VOTING_POWER = 0.01;
const SMART_CHEF_URL =
  'https://api.thegraph.com/subgraphs/name/akshaysoam8/smartchef';
const VOTING_API_URL = 'https://voting-api.pancakeswap.info/api/power';

/**
 * Fetches voting power of one address
 */
const fetchVotingPower = async (
  address: string,
  block: number,
  poolAddresses: string[]
): Promise<VotingResponse> => {
  const response = await customFetch(VOTING_API_URL, {
    method: 'POST',
    body: JSON.stringify({
      block,
      address,
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
    const promises = addresses.map((address) => {
      return fetchVotingPower(address, blockTag, poolAddresses);
    }) as ReturnType<typeof fetchVotingPower>[];
    const votingPowerResults = await Promise.all(promises);

    const calculatedPower = votingPowerResults.reduce(
      (accum, response, index) => {
        const address = addresses[index];
        const total = parseFloat(response.total);

        return {
          ...accum,
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
