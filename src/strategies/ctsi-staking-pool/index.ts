import { BigNumber, FixedNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = 'cartesi';
export const version = '0.1.0';

const SUBGRAPH_URL_ROOT = 'https://api.thegraph.com/subgraphs/name/cartesi/pos';

const NETWORK_KEY = {
  '1': '',
  '5': '-goerli'
};

function buildSubgraphUrl(chainId) {
  const networkString = NETWORK_KEY[chainId];
  return `${SUBGRAPH_URL_ROOT}${networkString}`;
}

async function getStakingPoolDelegatorBalance(
  url,
  addresses,
  options,
  snapshot
): Promise<Record<string, BigNumber>> {
  // query for StakingPool balance of voters
  const query = {
    poolBalances: {
      __args: {
        where: {
          user_in: addresses
        },
        first: 1000
      },
      pool: {
        amount: true,
        shares: true,
        manager: true
      },
      user: {
        id: true
      },
      shares: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    query.poolBalances.__args.block = { number: snapshot };
  }
  const score: Record<string, BigNumber> = {};
  const result = await subgraphRequest(url, query);
  if (result && result.poolBalances) {
    result.poolBalances.forEach((poolBalance) => {
      const address = getAddress(poolBalance.user.id);
      const poolShares = FixedNumber.from(poolBalance.pool.shares);
      const poolAmount = FixedNumber.from(poolBalance.pool.amount);
      const shares = FixedNumber.from(poolBalance.shares);
      const balance = BigNumber.from(
        poolAmount
          .mulUnsafe(shares.divUnsafe(poolShares))
          .floor()
          .toFormat('ufixed128x0')
          .toString()
      );
      // a staker can stake to several pools, so we must add the value if there is already one
      score[address] = score[address] ? score[address].add(balance) : balance;
    });
  }

  return score;
}

function verifyResults(
  results: Record<string, number>,
  expectedResults: Record<string, number>
): void {
  Object.entries(results).forEach(([address, score]) => {
    const expectedScore =
      expectedResults[address.toLowerCase()] ??
      expectedResults[getAddress(address)];
    if (score !== expectedScore) {
      console.error(
        `>>> ERROR: Score do not match for address ${address}, expected ${expectedScore}, got ${score}`
      );
    }
  });
}

export async function strategy(
  _space,
  network,
  _provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  // convert addresses to lowercase, as in subgraph they are all lowercase
  addresses = addresses.map((address) => address.toLowerCase());

  // build subgraph URL based on network, as we have one for mainnet and another for goerli
  const url = buildSubgraphUrl(network);

  // get balance staked in pools
  const results = await getStakingPoolDelegatorBalance(
    url,
    addresses,
    options,
    snapshot
  );

  const scores = Object.fromEntries(
    Object.entries(results).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, 18))
    ])
  );

  if (options.expectedResults && snapshot !== 'latest') {
    // validate testing expected results
    verifyResults(scores, options.expectedResults.scores);
  }

  return scores;
}
