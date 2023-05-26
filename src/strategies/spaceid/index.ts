import { strategy as UniswapV3Strategy } from '../uniswap-v3';
import { subgraphRequest } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';
import { getScoresDirect } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'Marcus';
export const version = '0.0.1';

const SPACE_NAME = 'dao.spaceid.eth';
const pancakeV3Subgraph =
  'https://api.thegraph.com/subgraphs/name/messari/pancakeswap-v3-bsc';
const snapshotSubgraph = {
  '1': 'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot',
  '5': 'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-goerli',
  '10': 'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-optimism',
  '56': 'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-binance-smart-chain',
  '100':
    'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-gnosis-chain',
  '137':
    'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-polygon',
  '250':
    'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-fantom',
  '42161':
    'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-arbitrum'
};

const UNISWAP_ID_USDC_PAIR = '0x6ac6b053a2858bea8ad758db680198c16e523184';
const PANCAKE_ID_USDT_PAIR = '0x4e1f9aDf96dBA6Dc09c973228c286568F1315ea8';

export async function getDelegatesBySpace(
  network: string,
  space: string,
  snapshot = 'latest',
  addresses: string[]
) {
  const spaceIn = [space];
  //if (space.includes('.eth')) spaceIn.push(space.replace('.eth', ''));

  const PAGE_SIZE = 1000;
  let result = [];
  let page = 0;
  const params: any = {
    delegations: {
      __args: {
        where: {
          space_in: spaceIn,
          delegate_in: addresses,
          delegator_not_in: addresses
        },
        first: PAGE_SIZE,
        skip: 0
      },
      delegator: true,
      space: true,
      delegate: true
    }
  };
  if (snapshot !== 'latest') {
    params.delegations.__args.block = { number: snapshot };
  }
  while (true) {
    params.delegations.__args.skip = page * PAGE_SIZE;

    const pageResult = await subgraphRequest(snapshotSubgraph[network], params);
    const pageDelegations = pageResult.delegations || [];
    result = result.concat(pageDelegations);
    page++;
    if (pageDelegations.length < PAGE_SIZE) break;
  }

  return result;
}

export async function getDelegations(space, network, addresses, snapshot) {
  const delegations = await getDelegatesBySpace(
    network,
    space,
    snapshot,
    addresses
  );
  if (!delegations) return {};

  const delegationsReverse = {};
  delegations.forEach(
    (delegation: any) =>
      (delegationsReverse[delegation.delegator] = delegation.delegate)
  );
  delegations
    .filter((delegation: any) => delegation.space !== '')
    .forEach(
      (delegation: any) =>
        (delegationsReverse[delegation.delegator] = delegation.delegate)
    );
  return Object.fromEntries(
    addresses.map((address) => [
      address,
      Object.entries(delegationsReverse)
        .filter(([, delegate]) => address.toLowerCase() === delegate)
        .map(([delegator]) => getAddress(delegator))
    ])
  );
}

async function getDelegationPower(network, provider, addresses, snapshot) {
  const strategies = [
    {
      name: 'erc20-balance-of',
      params: {
        address: '0x2dfF88A56767223A5529eA5960Da7A3F5f766406',
        decimals: 18
      }
    }
  ];
  const delegationSpace = SPACE_NAME;
  const delegations = await getDelegations(
    delegationSpace,
    network,
    addresses,
    snapshot
  );
  if (Object.keys(delegations).length === 0) return {};

  const scores = (
    await getScoresDirect(
      SPACE_NAME,
      strategies,
      network,
      provider,
      Object.values(delegations).reduce((a: string[], b: string[]) =>
        a.concat(b)
      ),
      snapshot
    )
  ).filter((score) => Object.keys(score).length !== 0);

  return Object.fromEntries(
    addresses.map((address) => {
      const addressScore = delegations[address]
        ? delegations[address].reduce(
            (a, b) => a + scores.reduce((x, y) => (y[b] ? x + y[b] : x), 0),
            0
          )
        : 0;
      return [address, addressScore];
    })
  );
}

async function getLpTokenOnBsc(addresses, snapshot) {
  const params = {
    accounts: {
      __args: {
        where: {
          id_in: addresses
        },
        block: snapshot !== 'latest' ? { number: snapshot } : { number_gte: 0 }
      },
      id: true,
      withdraws: {
        __args: {
          where: { pool: PANCAKE_ID_USDT_PAIR }
        },
        inputTokenAmounts: true,
        timestamp: true
      },
      deposits: {
        __args: {
          where: { pool: PANCAKE_ID_USDT_PAIR }
        },
        inputTokenAmounts: true,
        timestamp: true
      }
    }
  };

  const pools = await subgraphRequest(pancakeV3Subgraph, params);

  const pancakeIDLPScore = {};
  for (const account of pools.accounts) {
    let IdLPToken: BigNumber = BigNumber.from(0);
    for (const withdraw of account.withdraws) {
      IdLPToken = IdLPToken.add(BigNumber.from(withdraw.inputTokenAmounts[0]));
    }
    for (const deposit of account.deposits) {
      IdLPToken = IdLPToken.sub(BigNumber.from(deposit.inputTokenAmounts[0]));
    }
    pancakeIDLPScore[account.id] = IdLPToken.div(WeiPerEther).toNumber();
    pancakeIDLPScore[account.id] < 0 && (pancakeIDLPScore[account.id] = 0);
  }
  return pancakeIDLPScore;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const delegationPower = await getDelegationPower(
    network,
    provider,
    addresses,
    snapshot
  );
  let LPScore = {};
  switch (network) {
    case 1:
      LPScore = await UniswapV3Strategy(
        space,
        network,
        provider,
        addresses,
        {
          poolAddress: UNISWAP_ID_USDC_PAIR,
          tokenReserve: 0
        },
        snapshot
      );
      break;
    case 56:
      LPScore = await getLpTokenOnBsc(addresses, snapshot);
      break;
  }
  return Object.fromEntries(
    addresses.map((address) => {
      const addressScore =
        (LPScore[address] ?? 0) + (delegationPower[address] ?? 0);
      // console.log(address, LPScore[address], delegationPower[address]);
      return [getAddress(address), addressScore];
    })
  );
}
