import { multicall } from '../../utils';
import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = 'jo-chemla';
export const version = '0.1.0';

const erc20ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)'
];

const BALANCER_SUBGRAPHS = {
  '1': 'https://subgrapher.snapshot.org/subgraph/arbitrum/93yusydMYauh7cfe9jEfoGABmwnX4GffHd7in8KJi1XB',
  '1-v2':
    'https://subgrapher.snapshot.org/subgraph/arbitrum/C4ayEZP2yTXRAB8vSaTrgN4m9anTe9Mdm2ViyiAuV9TV',
  '137-v2':
    'https://subgrapher.snapshot.org/subgraph/arbitrum/H9oPAbXnobBRq1cB3HDmbZ1E8MWQyJYQjT1QDJMrdbNp',
  '42161-v2':
    'https://subgrapher.snapshot.org/subgraph/arbitrum/98cQDy6tufTJtshDCuhh9z2kWXsQWBHVh2bqnLHsGAeS'
};

function buildBalancerSubgraphUrl(chainId, version) {
  return BALANCER_SUBGRAPHS[`${chainId}${version === 2 ? '-v2' : ''}`];
}

const params = {
  pool: {
    __args: { id: '' },
    totalShares: true,
    tokens: {
      __args: {
        where: { address: '' }
      },
      balance: true,
      address: true
    },
    shares: {
      __args: {
        where: {
          userAddress_in: [],
          balance_gt: 0
        }
      },
      userAddress: {
        id: true
      },
      balance: true
    }
  }
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  // @ts-ignore
  params.pool.__args.id = options.balancerPoolId;
  params.pool.tokens.__args.where.address = options.tokenAddress;
  // @ts-ignore
  params.pool.shares.__args.where.userAddress_in = [options.stakingContract];

  if (snapshot !== 'latest') {
    // @ts-ignore
    params.pool.__args.block = { number: snapshot };
  }

  // iterate through Balancer V1 & V2 Subgraphs
  const score = {};
  for (let version = 1; version <= 2; version++) {
    // Skip attempt to query subgraph on networks where V1 isn't deployed
    if (network != 1 && network != 42 && version === 1) continue;

    // @ts-ignore
    const url = buildBalancerSubgraphUrl(network, version);
    const result = await subgraphRequest(url, params);
    if (result && result.pool) {
      const pool = result.pool;
      // Since we did the filter where token address, we are sure tokens[0] is what we are looking for
      // Idem, first share of pool.shares is that of staking contract
      const tokensPerStkLP =
        pool.tokens[0].balance * (pool.shares[0].balance / pool.totalShares);

      // Call totalSupply stakingContract and balanceOf stakingContract token of every address
      const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
      const res = await multicall(
        network,
        provider,
        erc20ABI,
        [[options.stakingContract, 'totalSupply', []]].concat(
          addresses.map((address: any) => [
            options.stakingContract,
            'balanceOf',
            [address]
          ])
        ),
        { blockTag }
      );
      const stkTotalSupply = res[0].toString(10);
      const response = res.slice(1);

      response.forEach((value, i) => {
        const userAddress = getAddress(addresses[i]);
        score[userAddress] = (value / stkTotalSupply) * tokensPerStkLP;
      });
    }
  }
  return score || {};
}
