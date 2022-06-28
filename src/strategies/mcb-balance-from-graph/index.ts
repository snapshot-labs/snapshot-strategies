import { subgraphRequest } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'yangzhao28';
export const version = '1.0.0';

const LIMIT = 500;

function makeQuery(snapshot, addressSet) {
  const query = {
    accounts: {
      __args: {
        where: {
          id_in: addressSet
        },
        first: LIMIT
      },
      id: true,
      balance: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    query.accounts.__args.block = { number: snapshot };
  }
  return query;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const _addresses = addresses.map((x) => x.toLowerCase());
  const addressSubsets = Array.apply(
    null,
    Array(Math.ceil(_addresses.length / LIMIT))
  ).map((_e, i) => _addresses.slice(i * LIMIT, (i + 1) * LIMIT));

  const returnedFromSubgraph = await Promise.all(
    addressSubsets.map((subset) =>
      subgraphRequest(options.graph, makeQuery(snapshot, subset))
    )
  );

  const result = returnedFromSubgraph.map((x) => x.accounts).flat();
  const scores = {};
  const scaler = BigNumber.from(10).pow(options.decimals || 18);
  addresses.forEach((address) => {
    const account = result.filter((x) => x.id == address.toLowerCase())[0];
    let score = 0;
    if (account) {
      if (options.decimals) {
        score = BigNumber.from(account.balance).div(scaler).toNumber();
      } else {
        score = parseFloat(account.balance);
      }
    }
    scores[address] = score;
  });
  return scores || {};
}
