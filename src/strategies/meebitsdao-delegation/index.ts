import { strategy as meebitsdao } from '../meebitsdao';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { subgraphRequest } from '../../utils';

export const author = 'maikir';
export const version = '0.1.0';

const MEEBITSDAO_DELEGATION_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/maikir/meebitsdao-delegation';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const graphApiUrl = 'https://api.thegraph.com/subgraphs/name/maikir/meebitsdao-delegation';

  const params = {
    delegations: {
      __args: {
        block: snapshot !== 'latest' ? { number: snapshot } : undefined,
      },
      id: true,
      count: true,
      delegator: true,
      delegate: true
    }
  }

  let result = await subgraphRequest(graphApiUrl, params);

  result = [].concat.apply([], Object.values(result));

  const mvoxScore = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options.tokenAddresses[0],
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
    options.tokenAddresses[1],
    snapshot
  );

  return Object.fromEntries(
    Object.entries(mfndScore).map((address: any) => [
      address[0],
      (address[0] in delegationScore) ? address[1] + delegationScore[address[0]] : address[1]
    ])
  );
}
