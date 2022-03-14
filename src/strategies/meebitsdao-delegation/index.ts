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

  const params = {
    delegations: {
      __args: snapshot !== 'latest' ? { block: { number: snapshot } } : {},
      id: true,
      delegator: true,
      delegate: true
    }
  }

  const result = await subgraphRequest(MEEBITSDAO_DELEGATION_SUBGRAPH_URL, params);

  const mvoxScore = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options.tokenAddresses[0],
    snapshot
  );

  const mfndScore = await meebitsdao(
    space,
    network,
    provider,
    addresses,
    options.tokenAddresses[1],
    snapshot
  );

  let delegations = {};

  result.delegations.forEach((delegation) => {
    if (delegation.delegator in mvoxScore) {
      (delegation.delegate in delegations) ? (delegations[delegation.delegate]+=mvoxScore[delegation.delegator]) : (delegations[delegation.delegate] = mvoxScore[delegation.delegator])
    }
  });

  return Object.fromEntries(
    Object.entries(mfndScore).map((address: any) => [
      address[0],
      (address[0] in delegations) ? address[1] + delegations[address[0]] : address[1]
    ])
  );

  //// ignore from here

  // const delegationScore = Object.entries(mvoxScore).reduce((obj, address) => {
  //   if (address[0] in delegators) {
  //     if (!obj[delegates[address[0]]]) {
  //       obj[delegates[address[0]]]=address[1]
  //     } else {
  //       obj[delegates[address[0]]]+=address[1];
  //     }
  //   }
  // }, {})

  // return Object.fromEntries(
  //   Object.entries(mfndScore).map((address: any) => [
  //     address[0],
  //     (address[0] in delegationScore) ? address[1] + delegationScore[address[0]] : address[1]
  //   ])
  // );
}
