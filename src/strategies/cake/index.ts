import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { strategy as masterChefPoolBalanceStrategy } from '../masterchef-pool-balance';
import { formatEther } from '@ethersproject/units';
import { Zero } from '@ethersproject/constants';
import { BigNumber } from '@ethersproject/bignumber';
import { multicall, subgraphRequest } from '../../utils';

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

const PAGE_SIZE = 1000;

export const author = 'pancake-swap';
export const version = '0.0.1';

const CAKE_ADDRESS = '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82';
const CAKE_BNB_LP_ADDRESS = '0x0eD7e52944161450477ee417DE9Cd3a859b14fD0';

const MASTER_CHEF_ADDRESS = {
  v1: '0x73feaa1eE314F8c655E354234017bE2193C9E24E'
};

const onChainVPBlockNumber = 16300686;
const onChainVPAddress = '0xc0FeBE244cE1ea66d27D23012B3D616432433F42';

const abi = [
  'function getVotingPowerWithoutPool(address _user) view returns (uint256)'
];

const smartChefUrl =
  'https://api.thegraph.com/subgraphs/name/chef-jojo/smartcheftest';

async function getPools(provider, snapshot: any) {
  let blockNumber = snapshot;
  if (blockNumber === 'latest') {
    blockNumber = await provider.getBlockNumber();
  }

  const params = {
    smartChefs: {
      __args: {
        where: {
          stakeToken: CAKE_ADDRESS.toLowerCase(),
          endBlock_gte: blockNumber,
          startBlock_lt: blockNumber
        }
      },
      id: true
    }
  };

  const pools = await subgraphRequest(smartChefUrl, params);

  return pools.smartChefs;
}

async function getStakedCakeAmount(
  snapshot: any,
  poolAddresses: string[],
  addresses: string[]
) {
  const params = {
    users: {
      __args: {
        where: {
          pool_in: poolAddresses.map((addr) => addr.toLowerCase()),
          address_in: addresses.map((addr) => addr.toLowerCase()),
          stakeAmount_gt: '0'
        },
        first: PAGE_SIZE
      },
      address: true,
      stakeAmount: true
    }
  };

  let page = 0;
  let results: any[] = [];
  let triedBlockNumber = false;

  while (true) {
    // @ts-ignore
    params.users.__args.skip = page * PAGE_SIZE;
    if (snapshot !== 'latest' && !triedBlockNumber) {
      // @ts-ignore
      params.users.__args.block = { number: snapshot };
    } else {
      // @ts-ignore
      delete params.users.__args.block;
    }
    const result = await subgraphRequest(smartChefUrl, params);
    if (!Array.isArray(result.users) && !triedBlockNumber) {
      triedBlockNumber = true;
      continue;
    }
    results = results.concat(result.users);
    page++;
    if (result.users.length < PAGE_SIZE) break;
  }

  return results.reduce<Record<string, BigNumber>>((acc, user) => {
    if (acc[user.address]) {
      acc[user.address] = (acc[user.address] as BigNumber).add(
        user.stakeAmount
      );
    } else {
      acc[user.address] = BigNumber.from(user.stakeAmount);
    }
    return acc;
  }, {});
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const pools = await getPools(provider, snapshot);

  const userPoolBalance = await getStakedCakeAmount(
    snapshot,
    pools.map((p) => p.id),
    addresses
  );

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  if (
    blockTag === 'latest' ||
    (typeof blockTag === 'number' && blockTag >= onChainVPBlockNumber)
  ) {
    let callData = addresses.map((address: any) => [
      onChainVPAddress,
      'getVotingPowerWithoutPool',
      [address.toLowerCase()]
    ]);

    callData = [...chunk(callData, options.max || 400)];
    const response: any[] = [];
    for (const call of callData) {
      const multiRes = await multicall(network, provider, abi, call, {
        blockTag
      });
      response.push(...multiRes);
    }
    const result = Object.fromEntries(
      response.map((value, i) => [
        addresses[i],
        parseFloat(
          formatEther(
            (userPoolBalance[addresses[i].toLowerCase()] || Zero).add(
              value.toString()
            )
          )
        )
      ])
    );

    return result;
  }

  const erc20Balance = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    {
      address: CAKE_ADDRESS,
      symbol: 'CAKE',
      decimals: 18
    },
    snapshot
  );

  const cakeBnbLpBalance = await masterChefPoolBalanceStrategy(
    space,
    network,
    provider,
    addresses,
    {
      chefAddress: MASTER_CHEF_ADDRESS.v1,
      uniPairAddress: CAKE_BNB_LP_ADDRESS,
      pid: '251',
      symbol: 'CAKE-BNB LP',
      tokenIndex: 0
    },
    snapshot
  );

  return Object.fromEntries(
    addresses.map((address) => [
      address,
      erc20Balance[address] +
        cakeBnbLpBalance[address] +
        parseFloat(formatEther(userPoolBalance[address.toLowerCase()] || Zero))
    ])
  );
}
