import { subgraphRequest } from '../../utils';
import { getProvider } from '../../utils';
import strategies from '..';
import fetch from 'cross-fetch';


export const author = 'drgorillamd';
export const version = '1.0.0';

const SMRT = '0xCC2f1d827b18321254223dF4e84dE399D9Ff116c';
const SMRTR = '0x6D923f688C7FF287dc3A5943CAeefc994F97b290';
const JADE = '0x7ad7242A99F21aa543F9650A56D141C57e4F6081';

const defaultGraphs = {
  '56': 'https://api.thegraph.com/subgraphs/name/apyvision/block-info',
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
  for (const strategy of options.strategies) {
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

  const chainBlocks = await getChainBlocks(
    snapshot,
    provider,
    options,
    network
  );

  let block = await provider.getBlock(typeof snapshot === 'number' ? snapshot : 'latest');
  let timestamp = block.timestamp;
  let jadePrice: number = await geckoPrice(JADE, timestamp, 'binance-smart-chain');
  let results: any = [];

  for (const strategy of options.strategies) {
    // If snapshot is taken before a network is activated then ignore its strategies
    if (
      options.startBlocks &&
      chainBlocks[strategy.network] < options.startBlocks[strategy.network]
    ) {
      continue;
    }

    if( strategy.network === '56' ) {

      let tmp = await strategies[strategy.name].strategy(
          space,
          strategy.network,
          getProvider(strategy.network),
          addresses,
          strategy.params,
          chainBlocks[strategy.network]
      );
      results.push(tmp);
      
    } else if( strategy.address === SMRT) {

      let tmp = await strategies[strategy.name].strategy(
          space,
          strategy.network,
          getProvider(strategy.network),
          addresses,
          strategy.params,
          chainBlocks[strategy.network]
      );

      const smrtPrice = await geckoPrice(SMRT, timestamp, 'avalanche');

      const weightedSmrt = Object.fromEntries(
                            Object.entries(tmp).map((res: any) => [
                              res[0],
                              res[1] * smrtPrice / Math.max(1, jadePrice) // Jade price not available before Nov-21
                            ])
        );
      results.push(weightedSmrt);

    } else if( strategy.address === SMRTR) { // SMRTr and SMRTr in LP
      let tmp = await strategies[strategy.name].strategy(
          space,
          strategy.network,
          getProvider(strategy.network),
          addresses,
          strategy.params,
          chainBlocks[strategy.network]
      );
      const smrtRPrice = await geckoPrice(SMRTR, timestamp, 'avalanche');

      const weightedSmrtR = Object.fromEntries(
                              Object.entries(tmp).map((res: any) => [
                                res[0],
                                res[1] * smrtRPrice / Math.max(1, jadePrice)
                              ])
        );
      results.push(weightedSmrtR);
    }

  }

  return results.reduce((finalResults: any, strategyResult: any) => {
    for (const [address, value] of Object.entries(strategyResult)) {
      if (!finalResults[address]) {
        finalResults[address] = 0;
      }

      finalResults[address] += value;
    }

    return finalResults;
  }, {});
}


async function geckoPrice(address, timestamp, chain) {
  const coingeckoApiURL = `https://api.coingecko.com/api/v3/coins/${chain}/contract/${address}/market_chart/range?vs_currency=usd&from=${
    timestamp - 100000
  }&to=${timestamp}`;
  const coingeckoData = await fetch(coingeckoApiURL)
    .then(async (r) => {
      const json = await r.json();
      return json;
    })
    .catch((e) => {
      console.error(e);
      throw new Error('jade-smrt:coingecko api failed');
    });

    return coingeckoData.prices?.pop()?.pop() || 0;
}