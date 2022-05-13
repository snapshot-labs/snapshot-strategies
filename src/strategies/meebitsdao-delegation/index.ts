import { getAddress } from '@ethersproject/address';
import { strategy as meebitsdaoStrategy } from '../meebitsdao';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { strategy as erc721Strategy } from '../erc721';
import { subgraphRequest, getProvider, getSnapshots } from '../../utils';

export const author = 'maikir';
export const version = '0.2.0';

const MEEBITSDAO_DELEGATION_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/maikir/meebitsdao-delegation';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blocks = await getSnapshots(
    network,
    snapshot,
    provider,
    options.tokenAddresses.map((s) => s.network || network)
  );

  const PAGE_SIZE = 1000;
  let result: any = [];
  let page = 0;
  const params: any = {
    delegations: {
      __args: {
        first: PAGE_SIZE,
        skip: 0
      },
      delegator: true,
      delegate: true
    }
  };
  if (snapshot !== 'latest') {
    params.delegations.__args.block = { number: snapshot };
  }

  //This function may only run to 6000 queries total (first: 1000 * 6 pages). After that, the query may return 0 results even though there may be more.
  while (true) {
    params.delegations.__args.skip = page * PAGE_SIZE;
    const pageResult = await subgraphRequest(
      MEEBITSDAO_DELEGATION_SUBGRAPH_URL,
      params
    );
    const pageDelegations = pageResult.delegations || [];
    result = result.concat(pageDelegations);
    page++;
    if (pageDelegations.length < PAGE_SIZE) break;
  }

  const lowerCaseAddresses: string[] = [];

  addresses.forEach((address) => {
    lowerCaseAddresses.push(address);
  });

  const mvoxAddresses: string[] = [];
  result.forEach((delegation) => {
    mvoxAddresses.push(delegation.delegator);
  });

  const mvoxScores = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    mvoxAddresses,
    options.tokenAddresses[0],
    snapshot
  );

  const mfndScores = await meebitsdaoStrategy(
    space,
    network,
    provider,
    lowerCaseAddresses,
    options.tokenAddresses[1],
    snapshot
  );

  const meebitsScores = await erc721Strategy(
    space,
    options.tokenAddresses[2].network,
    getProvider(options.tokenAddresses[2].network),
    lowerCaseAddresses,
    options.tokenAddresses[2],
    blocks[options.tokenAddresses[2].network]
  );

  const delegations = {};

  result.forEach((delegation) => {
    let meebitsScore = 0;
    let mvoxScore = 0;
    if (
      delegation.delegator in mvoxScores &&
      delegation.delegate in meebitsScores
    ) {
      meebitsScore = Math.max(
        1,
        Math.min(20, meebitsScores[delegation.delegate])
      );
      mvoxScore = mvoxScores[delegation.delegator];
    }

    if (delegation.delegate in delegations) {
      delegations[delegation.delegate] += mvoxScore * meebitsScore;
    } else {
      delegations[delegation.delegate] = mvoxScore * meebitsScore;
    }
  });

  const entries = Object.entries(mfndScores).map((address: any) => {
    const founderAddress = address[0].toLowerCase();
    return [
      getAddress(founderAddress),
      Math.min(
        founderAddress in delegations
          ? Math.max(address[1], delegations[founderAddress])
          : address[1],
        1000
      )
    ];
  });

  const score = Object.fromEntries(entries);

  return score || {};
}
