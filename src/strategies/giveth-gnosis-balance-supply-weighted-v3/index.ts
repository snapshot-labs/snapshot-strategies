import { subgraphRequest } from '../../utils';
import { getAddress } from '@ethersproject/address';
import { formatUnits } from '@ethersproject/units';

export const author = 'divine-comedian';
export const version = '0.1.0';

const GIVETH_SUBGRAPH_API =
  'https://subgrapher.snapshot.org/subgraph/arbitrum/7UFA1vv3cXNKzzaSVWt6Fe4EhU8B71G97XwWWkN4kxAW';
const XDAI_BLOCKS_API =
  'https://subgrapher.snapshot.org/subgraph/arbitrum/HTGgWawRHBKr6tDe6umPoVNkYDoUpBEsJSGtX6A7N8MG';

const CIRCULATING_SUPPLY_API = 'https://circulating.giveth.io/token-supply';
// "supplyField" : "circulating",

const blockParams = {
  blocks: {
    __args: {
      first: 1,
      orderBy: 'timestamp',
      orderDirection: 'desc',
      where: {
        timestamp_lte: ''
      }
    },
    number: true
  }
};

const pairParams = {
  pair: {
    __args: {
      id: ''
    },
    reserve0: true,
    totalSupply: true
  }
};

const params = {
  tokenBalances: {
    __args: {
      orderBy: 'id',
      orderDirection: 'asc',
      where: {
        user_in: []
      }
    },
    id: true,
    balance: true,
    token: true
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
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const block = await provider.getBlock(blockTag);
  blockParams.blocks.__args.where.timestamp_lte = block.timestamp;
  const xDaiBlock = await subgraphRequest(XDAI_BLOCKS_API, blockParams);
  const blockNumber = Number(xDaiBlock.blocks[0].number);
  // @ts-ignore
  params.tokenBalances.__args.block = { number: blockNumber };
  if (snapshot !== 'latest') {
    // @ts-ignore
    pairParams.pair.__args.block = { number: blockNumber };
  }

  params.tokenBalances.__args.where.user_in = addresses.map((address) =>
    address.toLowerCase()
  );

  const data = subgraphRequest(GIVETH_SUBGRAPH_API, params);
  const supply = fetch(CIRCULATING_SUPPLY_API, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });
  const [supplyData, balanceData] = await Promise.all([supply, data]);
  const supplyJSON = await supplyData.json();
  const circulatingSupply = parseFloat(
    formatUnits(supplyJSON.circulating, options.decimals)
  );
  const score = {};
  balanceData.tokenBalances.map((addressBalance) => {
    const id = addressBalance.id.split('-')[1];
    const prevScore = score[getAddress(id)] ? score[getAddress(id)] : 0;
    score[getAddress(id)] =
      prevScore +
      (parseFloat(formatUnits(addressBalance.balance, options.decimals)) /
        circulatingSupply) *
        options.weight;
  });
  return score;
}
