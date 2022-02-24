import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.1';

const SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/dapp-testing/potion-unlock';

const rarityConfigs = [
  {
    startTokenId: 0,
    endTokenId: 999,
    vp: 1
  },
  {
    startTokenId: 1000,
    endTokenId: 1999,
    vp: 2
  },
  {
    startTokenId: 2000,
    endTokenId: 2999,
    vp: 3
  },
  {
    startTokenId: 3000,
    endTokenId: 3999,
    vp: 4
  },
  {
    startTokenId: 4000,
    endTokenId: 4999,
    vp: 5
  },
  {
    startTokenId: 5000,
    endTokenId: 5999,
    vp: 6
  }
];

function tokenIdToVP(tokenId) {
  const id = parseInt(tokenId);
  let vp = 0;
  rarityConfigs.forEach(config => {
    if (id >= config.startTokenId && id <= config.endTokenId)
      vp = config.vp;
  });
  return vp;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const pages = [...Array(4).keys()];
  const params = Object.fromEntries(
    pages.map((page, i) => [
      `_${page}`,
      {
        __aliasFor: 'nfts',
        __args: {
          first: 1000,
          skip: i * 1000,
          orderBy: 'tokenId',
          orderDirection: 'asc'
        },
        tokenId: true,
        owner: true
      }
    ])
  );
  if (snapshot !== 'latest') {
    pages.forEach((page) => {
      // @ts-ignore
      params[`_${page}`].__args.block = { number: snapshot };
    });
  }
  let result = await subgraphRequest(SUBGRAPH_URL, params);
  result = Object.values(result).flat();
  const scores = {};
  addresses.forEach((address) => (scores[address] = 0));
  result.forEach((nft) => {
    const owner = getAddress(nft.owner);
    if (typeof scores[owner] === 'number')
      scores[owner] += tokenIdToVP(nft.tokenId);
  });
  return scores;
}
