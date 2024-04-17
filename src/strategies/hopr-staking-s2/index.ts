import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { subgraphRequest } from '../../utils';

export const author = 'QYuQianchen';
export const version = '0.1.0';

const XDAI_BLOCK_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/1hive/xdai-blocks';
const HOPR_STAKING_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/hoprnet/staking-season2';
const LIMIT = 1000; // 1000 addresses per query in Subgraph

async function getXdaiBlockNumber(timestamp: number): Promise<number> {
  const query = {
    blocks: {
      __args: {
        first: 1,
        orderBy: 'number',
        orderDirection: 'desc',
        where: {
          timestamp_lte: timestamp
        }
      },
      number: true,
      timestamp: true
    }
  };
  const data = await subgraphRequest(XDAI_BLOCK_SUBGRAPH_URL, query);
  return Number(data.blocks[0].number);
}

async function stakingSubgraphQuery(
  addresses: string[],
  blockNumber: number,
  snapshot: number | string
): Promise<{ [propName: string]: BigNumber }> {
  const query = {
    accounts: {
      __args: {
        first: LIMIT,
        where: {
          id_in: addresses.map((adr) => adr.toLowerCase())
        }
      },
      id: true,
      actualStake: true,
      unclaimedRewards: true
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    query.accounts.__args.block = { number: blockNumber };
  }
  const data = await subgraphRequest(HOPR_STAKING_SUBGRAPH_URL, query);
  // map result (data.accounts) to addresses
  const entries = data.accounts.map((d) => [
    d.id,
    BigNumber.from(d.actualStake).add(BigNumber.from(d.unclaimedRewards))
  ]);
  return Object.fromEntries(entries);
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const isXdai = network === '100'; // either xDAI or ETH mainnet
  const block = await provider.getBlock(blockTag);

  // get the block number for subgraph query
  const subgraphBlock = isXdai
    ? block.number
    : await getXdaiBlockNumber(block.timestamp);

  // trim addresses to sub of "LIMIT" addresses.
  const addressSubsets = Array.apply(
    null,
    Array(Math.ceil(addresses.length / LIMIT))
  ).map((_e, i) => addresses.slice(i * LIMIT, (i + 1) * LIMIT));

  const returnedFromSubgraph = await Promise.all(
    addressSubsets.map((subset) =>
      stakingSubgraphQuery(subset, subgraphBlock, snapshot)
    )
  );

  // get and parse balance from subgraph
  const subgraphBalance = Object.assign({}, ...returnedFromSubgraph);
  const subgraphScore = addresses.map(
    (address) => subgraphBalance[address.toLowerCase()] ?? 0
  );

  return Object.fromEntries(
    addresses.map((adr, i) => [
      adr,
      parseFloat(formatUnits(subgraphScore[i], 18)) // subgraph balance
    ])
  );
}
