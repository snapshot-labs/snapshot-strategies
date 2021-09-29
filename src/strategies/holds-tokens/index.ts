import { formatUnits } from '@ethersproject/units';
import { multicall, getProvider, subgraphRequest } from '../../utils';

export const author = 'lightninglu10';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
];

const defaultGraphs = {
  '56': 'https://api.thegraph.com/subgraphs/name/apyvision/block-info',
  '137': 'https://api.thegraph.com/subgraphs/name/sameepsi/maticblocks'
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

async function getChainBlocks(
  snapshot,
  provider,
  options,
  network
): Promise<any> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const block = await provider.getBlock(blockTag);
  const chainBlocks = {};
  for (const strategy of options.tokenAddresses) {
    if (chainBlocks[strategy.network]) {
      continue;
    }
    if (blockTag === 'latest' || strategy.network === network) {
      chainBlocks[strategy.network] = blockTag;
    } else {
      const graph =
        options.graphs?.[strategy.network] || defaultGraphs[strategy.network];
      chainBlocks[strategy.network] = await getChainBlockNumber(
        block.timestamp,
        graph
      );
    }
  }

  return chainBlocks;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const tokens = options.tokenAddresses || [];

  const holdsToken = (balance) => {
    return balance > 0;
  }

  const calculateVotes = (bool) => {
    return bool ? 1 : 0
  }

  const chainBlocks = await getChainBlocks(
    snapshot,
    provider,
    options,
    network
  );

  const allAddresses = {};

  for (let i = 0; i < tokens.length; i++) {
    const {address, network} = tokens[i];

    const multicallAddresses = addresses.map((userAddress: any) => [address, 'balanceOf', [userAddress]]);
    const chainProvider = getProvider(network);

    let blockTag = chainBlocks[network]
    if (options.snapshot === 'latest') {
      blockTag = chainProvider.getBlockNumber();
    }

    const response = await multicall(
      network,
      chainProvider,
      abi,
      multicallAddresses,
      { blockTag }
    );

    response.forEach((value, i) => {
      const addressHasToken = holdsToken(
        parseFloat(formatUnits(value.toString(), options.decimals))
      );

      if (allAddresses[addresses[i]] !== undefined) {
        allAddresses[addresses[i]] = allAddresses[addresses[i]] && addressHasToken;
      } else {
        allAddresses[addresses[i]] = addressHasToken;
      }
    });
  }

  const entries = addresses.map(address => [
    address,
    calculateVotes(allAddresses[address])
  ]);

  return Object.fromEntries(
    entries
  );
}
