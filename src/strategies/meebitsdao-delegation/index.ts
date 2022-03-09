import fetch from 'cross-fetch';
import { strategy as meebitsdao } from '../meebitsdao';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'maikir';
export const version = '0.0.1';

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

  const graphApiUrl = `https://api.coingecko.com/api/v3/coins/${platform}/contract/${address}/market_chart/range?vs_currency=${currency}&from=${
    block.timestamp - 100000
  }&to=${block.timestamp}`;
  let graphApiData = await fetch(graphApiUrl)
    .then(async (r) => {
      const json = await r.json();
      return json.data.delegations;
    })
    .catch((e) => {
      console.error(e);
      throw new Error('Strategy meebitsdao-delegation: graph api failed');
    });

  const mvoxScore = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  const delegationScore = Object.entries(mvoxScore).reduce((obj, address) => {
    if (address[0] in delegators) {
      if (!obj[delegates[address[0]]]) {
        obj[delegates[address[0]]]=address[1]
      } else {
        obj[delegates[address[0]]]+=address[1];
      }
    }
  }, {})

  const mfndScore = await meebitsdao(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  return Object.fromEntries(
    Object.entries(mfndScore).map((address: any) => [
      address[0],
      (address[0] in delegationScore) ? address[1] + delegationScore[address[0]] : address[1]
    ])
  );
}
