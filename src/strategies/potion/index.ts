import { getAddress } from '@ethersproject/address';
import { Multicaller, subgraphRequest } from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.1';

const SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/dapp-testing/potion-unlock';

const abi = [
  'function rarityConfig(uint256) view returns (uint32 startTokenId, uint32 endTokenId, uint32 secretSegmentStart, uint32 secretSegmentLength, uint32 bytesPerPiece)'
];

function parseConfigs(configs) {
  return Object.values(configs).map((config: any) => {
    const supply = config[1] - config[0] + 1;
    return {
      startTokenId: config[0],
      endTokenId: config[1],
      secretSegmentLength: config[3],
      supply,
      vp: (config[3] / supply) * 1e3
    };
  });
}

function tokenIdToVP(tokenId, configs) {
  const id = parseInt(tokenId);
  let vp = 0;
  configs.forEach((config) => {
    if (id >= config.startTokenId && id <= config.endTokenId) vp = config.vp;
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
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const rarityCount = [...Array(6).keys()];
  const multi = new Multicaller(network, provider, abi, { blockTag });
  rarityCount.forEach((rarity) =>
    multi.call(rarity, options.address, 'rarityConfig', [rarity])
  );
  const configs = parseConfigs(await multi.execute());

  const pages = [...Array(6).keys()];
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
      scores[owner] += tokenIdToVP(nft.tokenId, configs);
  });
  return scores;
}
