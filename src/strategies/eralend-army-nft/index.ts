import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = 'nexonfidev';
export const version = '0.1.0';

const LIMIT = 1000;

export const SUBGRAPH_URL = {
  '137': 'https://api.thegraph.com/subgraphs/name/nexon-finance/nexon-army-nft'
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockNumber =
    typeof snapshot === 'number'
      ? snapshot
      : (await provider.getBlock('latest')).number;

  const _addresses = addresses.map((x) => x.toLowerCase());
  const addressSubsets = Array.apply(
    null,
    Array(Math.ceil(_addresses.length / LIMIT))
  ).map((_e, i) => _addresses.slice(i * LIMIT, (i + 1) * LIMIT));

  const returnedFromSubgraph = await Promise.all(
    addressSubsets.map((subset) =>
      subgraphRequest(SUBGRAPH_URL[network], makeQuery(blockNumber, subset))
    )
  );

  const subgraphResult = returnedFromSubgraph
    .map((x) => x.votingWeights)
    .flat();
  if (!subgraphResult) return;

  const score = {};
  subgraphResult.forEach((owner) => {
    if (!score[getAddress(owner.address)]) {
      score[getAddress(owner.address)] = parseFloat(owner.weight);
    }
  });

  return score;
}

function makeQuery(snapshot, addressSet) {
  const query = {
    votingWeights: {
      __args: {
        where: {
          address_in: addressSet,
          block_lte: snapshot
        },
        orderBy: 'block',
        orderDirection: 'desc',
        first: LIMIT
      },
      address: true,
      weight: true
    }
  };
  return query;
}
