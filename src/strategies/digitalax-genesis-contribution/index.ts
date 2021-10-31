import { subgraphRequest, multicall } from '../../utils';
import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import fetch from 'cross-fetch';

export const author = 'onigiri-x';
export const version = '0.1.0';

const abiStaking = [
  'function getGenesisContribution(uint256 _tokenId) external view returns (uint256)'
];

const DIGITALAX_SUBGRAPH =
  'https://api.thegraph.com/subgraphs/name/digitalax/digitalax';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const block = await provider.getBlock(blockTag);

  const genesisStaking = '0xa202d5b0892f2981ba86c981884ceba49b8ae096';

  // Set up the GraphQL parameters and necessary variables
  const holderParams = {
    digitalaxGenesisNFTs: {
      __args: {
        where: {
          owner_in: addresses
        },
        first: 1000
      },
      id: true,
      owner: true
    }
  };

  const stakerParams = {
    digitalaxGenesisStakedTokens: {
      __args: {
        where: {
          staker_in: addresses
        },
        first: 1000
      },
      id: true,
      staker: true
    }
  };

  // Query subgraph for the holders and the stakers based on input addresses
  const resultOwners = await subgraphRequest(DIGITALAX_SUBGRAPH, holderParams);
  const resultStakers = await subgraphRequest(DIGITALAX_SUBGRAPH, stakerParams);

  const tokenIdsForAddress: Record<string, number[]> = {};
  let tokenIdsToCheck: number[] = [];
  const tokenIdsWithContribution: Record<number, BigNumberish> = {};

  // For each nft in user wallets, take note of the token ids
  resultOwners.digitalaxGenesisNFTs.forEach((nft) => {
    if (!tokenIdsForAddress[nft.owner]) {
      tokenIdsForAddress[nft.owner] = [nft.id];
    } else {
      tokenIdsForAddress[nft.owner] = tokenIdsForAddress[nft.owner].concat(
        nft.id
      );
    }
    tokenIdsToCheck.push(nft.id);
    // Make double sure no duplicates
    tokenIdsForAddress[nft.owner] = [...new Set(tokenIdsForAddress[nft.owner])];
  });

  // For each nft in staking contract, take note of the token ids
  resultStakers.digitalaxGenesisStakedTokens.forEach((nft) => {
    if (!tokenIdsForAddress[nft.staker]) {
      tokenIdsForAddress[nft.staker] = [nft.id];
    } else {
      tokenIdsForAddress[nft.staker] = tokenIdsForAddress[nft.staker].concat(
        nft.id
      );
    }
    tokenIdsToCheck.push(nft.id);
    // Make double sure no duplicates
    tokenIdsForAddress[nft.staker] = [
      ...new Set(tokenIdsForAddress[nft.staker])
    ];
  });

  // Make sure no duplicates
  tokenIdsToCheck = [...new Set(tokenIdsToCheck)];

  // Get the genesis contribution for all the token ID's we recorded from the staking contract itself
  const result2 = await multicall(
    network,
    provider,
    abiStaking,
    tokenIdsToCheck.map((tokenId: any) => [
      genesisStaking,
      'getGenesisContribution',
      [tokenId]
    ]),
    { blockTag }
  );
  result2.forEach((x, i) => {
    tokenIdsWithContribution[tokenIdsToCheck[i]] = x;
  });

  const monaPriceConversion = await getConversionMonaPerETH(block);

  // Set up a record list for all the genesis tokens with their summed up contribution
  const genesisRecord: Record<string, number> = {};
  addresses.forEach((addr) => {
    const tokenIds = tokenIdsForAddress[addr];
    if (tokenIds) {
      const decimalContributions = tokenIds.map((x) => {
        return parseFloat(
          formatUnits(tokenIdsWithContribution[x][0], options.decimals)
        );
      });
      genesisRecord[addr] =
        decimalContributions.reduce((a, b) => a + b, 0) * monaPriceConversion;
    } else {
      genesisRecord[addr] = 0;
    }
  });

  return genesisRecord;
}

async function getConversionMonaPerETH(block) {
  // Find the coingecko for monavale to eth
  const coingeckoApiURL = `https://api.coingecko.com/api/v3/coins/monavale/market_chart/range?vs_currency=eth&from=${
    block.timestamp - 100000
  }&to=${block.timestamp}`;
  const coingeckoData = await fetch(coingeckoApiURL)
    .then(async (r) => {
      const json = await r.json();
      return json;
    })
    .catch((e) => {
      console.error(e);
      throw new Error(
        'Strategy digitalax-genesis-contribution: coingecko api failed'
      );
    });

  const priceConversion = parseFloat(coingeckoData.prices?.pop()[1]);
  return 1 / priceConversion;
}
