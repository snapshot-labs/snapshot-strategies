import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { strategy as masterChefPoolBalanceStrategy } from '../masterchef-pool-balance';
import { formatEther } from '@ethersproject/units';
import { Zero, WeiPerEther } from '@ethersproject/constants';
import { BigNumber } from '@ethersproject/bignumber';
import { multicall, subgraphRequest, Multicaller } from '../../utils';

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

const PAGE_SIZE = 1000;

export const author = 'orbital-swap';
export const version = '0.0.1';

const ORB_ADDRESS = '0x42b98A2f73a282D731b0B8F4ACfB6cAF3565496B';
const ORB_VAULT_ADDRESS = '0xE4C7Ef82824Dc78c3f1Fe542E2eC171C6cf9bC2f';
const ORB_BNB_LP_ADDRESS = '0x451a503b59A4DEA428b8eb88D6df27DE8A7fcfe1';

const MASTER_CHEF_ADDRESS = {
  v0: '0xd67a0CE4B1484DBa8dB53349F9b26a3272dB04F5'
};

const onChainVotingPower = {
  v0: {
    blockNumber: 19288664,
    address: '0xE6CCB01cAafc11c21AdCc415BB802FB1cF77d7dE'
  },
};

const abi = [
  'function getVotingPowerWithoutPool(address _user) view returns (uint256)'
];

const vaultAbi = [
  'function getPricePerFullShare() view returns (uint256)',
  'function userInfo(address) view returns (uint256 shares, uint256 lastDepositedTime, uint256 orbAtLastUserAction, uint256 lastUserActionTime)'
];

const cosmosUrl =
  'https://api.thegraph.com/subgraphs/name/orbitalswap/cosmos';

async function getPools(provider, snapshot: any) {
  let blockNumber = snapshot;
  if (blockNumber === 'latest') {
    blockNumber = await provider.getBlockNumber();
  }

  const params = {
    smartChefs: {
      __args: {
        where: {
          stakeToken: ORB_ADDRESS.toLowerCase(),
          endBlock_gte: blockNumber,
          startBlock_lt: blockNumber
        }
      },
      id: true
    }
  };

  const pools = await subgraphRequest(cosmosUrl, params);

  return pools.smartChefs;
}

async function getCosmosStakedOrbAmount(
  snapshot: any,
  poolAddresses: string[],
  addresses: string[]
) {
  const addressChunks = chunk(addresses, 1500);
  let results: any[] = [];

  for (const addressChunk of addressChunks) {
    const params = {
      users: {
        __args: {
          where: {
            pool_in: poolAddresses.map((addr) => addr.toLowerCase()),
            address_in: addressChunk.map((addr) => addr.toLowerCase()),
            stakeAmount_gt: '0'
          },
          first: PAGE_SIZE
        },
        address: true,
        stakeAmount: true
      }
    };

    let page = 0;
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
      let result;
      try {
        result = await subgraphRequest(cosmosUrl, params);
      } catch (error) {
        if (!triedBlockNumber) {
          triedBlockNumber = true;
          continue;
        } else {
          throw error;
        }
      }
      if (!Array.isArray(result.users) && !triedBlockNumber) {
        triedBlockNumber = true;
        continue;
      }
      results = results.concat(result.users);
      page++;
      if (result.users.length < PAGE_SIZE) break;
    }
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

  const userPoolBalance = await getCosmosStakedOrbAmount(
    snapshot,
    pools.map((p) => p.id),
    addresses
  );

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  if (
    blockTag === 'latest' ||
    (typeof blockTag === 'number' &&
      blockTag >= onChainVotingPower.v0.blockNumber)
  ) {
    let callData = addresses.map((address: any) => [
      typeof blockTag === 'number' &&
      onChainVotingPower.v0.address,
      'getVotingPowerWithoutPool',
      [address.toLowerCase()]
    ]);

    callData = [...chunk(callData, options.max || 300)];
    const response: any[] = [];
    for (const call of callData) {
      const multiRes = await multicall(network, provider, abi, call, {
        blockTag
      });
      response.push(...multiRes);
    }
    return Object.fromEntries(
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
  }

  const erc20Balance = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    {
      address: ORB_ADDRESS,
      symbol: 'ORB',
      decimals: 18
    },
    snapshot
  );

  const orbBnbLpBalance = await masterChefPoolBalanceStrategy(
    space,
    network,
    provider,
    addresses,
    {
      chefAddress: MASTER_CHEF_ADDRESS.v0,
      uniPairAddress: ORB_BNB_LP_ADDRESS,
      pid: '2',
      symbol: 'ORB-BNB LP',
      tokenIndex: 0
    },
    snapshot
  );

  const orbVaultBalance = await getVaultBalance(
    network,
    provider,
    addresses,
    blockTag
  );

  return Object.fromEntries(
    addresses.map((address) => [
      address,
      erc20Balance[address] +
        orbBnbLpBalance[address] +
        parseFloat(
          formatEther(
            (userPoolBalance[address.toLowerCase()] || Zero).add(
              orbVaultBalance[address] || Zero
            )
          )
        )
    ])
  );
}

async function getVaultBalance(network, provider, addresses, blockTag) {
  const vaultMulti = new Multicaller(network, provider, vaultAbi, { blockTag });

  vaultMulti.call(
    ORB_VAULT_ADDRESS,
    ORB_VAULT_ADDRESS,
    'getPricePerFullShare'
  );

  addresses.forEach((address) =>
    vaultMulti.call(
      `${ORB_VAULT_ADDRESS}-${address}`,
      ORB_VAULT_ADDRESS,
      'userInfo',
      [address]
    )
  );


  const vaultMultiRes = await vaultMulti.execute();

  return Object.fromEntries<BigNumber>(
    addresses.map((address) => [
      address,
      (vaultMultiRes[ORB_VAULT_ADDRESS] || Zero)
        .mul(vaultMultiRes[`${ORB_VAULT_ADDRESS}-${address}`]?.shares || Zero)
        .div(WeiPerEther)
    ])
  );
}
