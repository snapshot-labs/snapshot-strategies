import {
  getProvider,
  getScoresDirect,
  multicall,
  subgraphRequest
} from '../../utils';

export const author = 'trizin';
export const version = '0.1.0';

const abi = [
  'function isVerifiedUser(address _user) external view returns (bool)'
];

/* Code from multichain strategy */

const defaultGraphs = {
  '56': 'https://api.thegraph.com/subgraphs/name/apyvision/block-info',
  '137': 'https://api.thegraph.com/subgraphs/name/sameepsi/maticblocks',
  '42161':
    'https://api.thegraph.com/subgraphs/name/ianlapham/arbitrum-one-blocks'
};

async function getChainBlockNumber(
  timestamp: number,
  graphURL: string
): Promise<number> {
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
  const data = await subgraphRequest(graphURL, query);
  return Number(data.blocks[0].number);
}

async function getChainBlocksFromSubGraph(
  snapshot,
  provider,
  options,
  network
): Promise<any> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const block = await provider.getBlock(blockTag);
  const chainBlocks = {};

  for (const strategy of Object.keys(options.chains)) {
    if (chainBlocks[strategy]) {
      continue;
    }
    if (blockTag === 'latest' || strategy === network) {
      chainBlocks[strategy] = blockTag;
    } else {
      const graph = options.graphs?.[strategy] || defaultGraphs[strategy];
      chainBlocks[strategy] = await getChainBlockNumber(block.timestamp, graph);
    }
  }

  return chainBlocks;
}

async function getChainBlocksFromApi(
  snapshot,
  provider,
  options
): Promise<any> {
  const block = await provider.getBlock(snapshot);
  const timestamp = block.timestamp;

  //Should receive the timestamp as query param and return the block height by chain
  const apiUrl = `${options.blockApi}?timestamp=${timestamp}`;
  const resp = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }).then((r) => r.json());

  //Response should contain blocks object with chainIds as keys and block numbers as values
  return resp.blocks;
}

async function getChainBlocks(
  snapshot,
  provider,
  options,
  network
): Promise<any> {
  if (options.blockApi) {
    return await getChainBlocksFromApi(snapshot, provider, options);
  } else {
    return await getChainBlocksFromSubGraph(
      snapshot,
      provider,
      options,
      network
    );
  }
}

////////////////////////////////////////////////////////////////////////////////

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const chainBlocks = await getChainBlocks(
    snapshot,
    provider,
    options,
    network
  );

  const brightIdNetwork = options.brightIdNetwork || network;
  const response = await multicall(
    brightIdNetwork,
    getProvider(brightIdNetwork),
    abi,
    addresses.map((address: any) => [
      options.registry,
      'isVerifiedUser',
      [address]
    ]),
    { blockTag: chainBlocks[brightIdNetwork] }
  );

  const totalScores = {};

  for (const chain of Object.keys(options.chains)) {
    let scores = await getScoresDirect(
      space,
      options.chains[chain],
      chain,
      getProvider(chain),
      addresses,
      chainBlocks[chain]
    );
    // [{ address: '0x...', score: 0.5 },{ address: '0x...', score: 0.5 }]
    // sum scores for each address and return

    scores = scores.reduce((finalScores: any, score: any) => {
      for (const [address, value] of Object.entries(score)) {
        if (!finalScores[address]) {
          finalScores[address] = 0;
        }
        finalScores[address] += value;
      }
      return finalScores;
    }, {});
    // { address: '0x...55', score: 1.0 }

    for (const key of Object.keys(scores)) {
      totalScores[key] = totalScores[key]
        ? totalScores[key] + scores[key]
        : scores[key];
    }
  }

  return Object.fromEntries(
    addresses.map((address, index) => {
      let addressScore = totalScores[address];
      addressScore *= response[index][0]
        ? options.brightIdMultiplier // brightId multiplier
        : options.notVerifiedMultiplier; // not verified multiplier
      return [address, addressScore];
    })
  );
}
