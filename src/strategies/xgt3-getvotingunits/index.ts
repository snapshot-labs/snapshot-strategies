import { BigNumberish } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';
import { formatUnits } from '@ethersproject/units';

export const author = 'gt3';
export const version = '0.1.0';
export const name = 'xgt3-getvotingunits';


const veTokenABI = [
  'function getVotingUnitsNFT(uint256 tokenId_) view returns (uint256)'
];

const NFTS_QUERY = `
  query NFTS_QUERY(
    $skip: Int,
    $first: Int,
    $orderBy: Nft_orderBy,
    $orderDirection: OrderDirection,
    $where: Nft_filter
    $block: Block_height
  ) {
    nfts(
      skip: $skip,
      first: $first,
      orderBy: $orderBy,
      orderDirection: $orderDirection,
      where: $where
      block: $block
    ) {
      tokenId
      owner
      burned,
      splitted,
    }
  }
`
type NFTSQueryVariable = {
  skip?: number;
  first?: number;
  orderBy: string;
  orderDirection: string;
  where: {
    owner_in: string[];
  };
  block?: {
    number: number;
  };
};

type GetNftsOptions = {
  subgraphURI: string;
  addresses: string[];
  blockTag?: number;
  all?: any[];
  skip?: number;
  first?: number;
};

// Consultamos a la subgraph para obtener los NFTs de cada address
const getNfts = async ({ subgraphURI, addresses = [], blockTag, all = [], skip = 0, first = 1000 } : GetNftsOptions) => {

  const variables = {
    skip,
    first,
    orderBy: 'tokenId',
    orderDirection: 'asc',
    where: {
      burned: false,
      splitted: false,
      owner_in: addresses
    }
  } as NFTSQueryVariable;

  if (blockTag) {
    variables.block = { number: blockTag };
  }

  const query = await fetch(subgraphURI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: NFTS_QUERY, variables })
  });
  const result = await query.json();

  const { nfts = [] } = result.data;
  all.push(...nfts);

  if (nfts.length === first) {
    return getNfts({ subgraphURI, addresses, blockTag, all, skip: skip + first, first });
  }
  return all;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : undefined;

  const nfts = await getNfts({ subgraphURI: options.subgraphURI, addresses, blockTag });

  const nftsByAddress = nfts.reduce((acc, nft) => {
    acc[nft.owner] = acc[nft.owner] || [];
    acc[nft.owner].push(nft.tokenId);
    return acc;
  }, {});

  // Initialize Multicaller
  const multi = new Multicaller(network, provider, veTokenABI, { blockTag });

  // Third batch: Get voting power for each token
  addresses.forEach((address) => {
    const tokensIds = nftsByAddress[address.toLowerCase()] || [];
    tokensIds.forEach((tokenId) => {
      multi.call(
        `${tokenId}`,
        options.address,
        'getVotingUnitsNFT',
        [tokenId]
      );
    });
  });

  const voteByTokenIds: Record<string, BigNumberish> = await multi.execute();

  // Calculate final scores
  const scores = {};
  addresses.forEach((address) => {
    const tokensIds = nftsByAddress[address.toLowerCase()] || [];
    let totalVotingPower = 0;
    tokensIds.forEach((tokenId) => {
      const power = voteByTokenIds[tokenId];
      totalVotingPower += Number(formatUnits(power, options.decimals || 18));
    });
    scores[address] = totalVotingPower;
  });

  return scores;
}
