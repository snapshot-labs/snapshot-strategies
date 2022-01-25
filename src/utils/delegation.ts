import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../utils';

const SNAPSHOT_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot',
  '4': 'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-rinkeby',
  '137':
    'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-polygon',
  '97':
    'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-binance-smart-chain',
  '42': 'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-kovan'
};

export async function getDelegations(space, network, addresses, snapshot) {
  const addressesLc = addresses.map((addresses) => addresses.toLowerCase());
  const spaceIn = ['', space];
  if (space.includes('.eth')) spaceIn.push(space.replace('.eth', ''));
  const pages = ['_1', '_2', '_3', '_4', '_5'];
  const params = Object.fromEntries(
    pages.map((q, i) => [
      q,
      {
        __aliasFor: 'delegations',
        __args: {
          where: {
            // delegate_in: addressesLc,
            // delegator_not_in: addressesLc,
            space_in: spaceIn
          },
          first: 1000,
          skip: i * 1000
        },
        delegator: true,
        space: true,
        delegate: true
      }
    ])
  );

  if (snapshot !== 'latest') {
    pages.forEach((page) => {
      // @ts-ignore
      params[page].__args.block = { number: snapshot };
    });
  }
  let result = await subgraphRequest(SNAPSHOT_SUBGRAPH_URL[network], params);
  result = result._1
    .concat(result._2)
    .concat(result._3)
    .concat(result._4)
    .concat(result._5);

  const delegations = result.filter(
    (delegation) =>
      addressesLc.includes(delegation.delegate) &&
      !addressesLc.includes(delegation.delegator)
  );
  if (!delegations) return {};

  const delegationsReverse = {};
  delegations.forEach(
    (delegation) =>
      (delegationsReverse[delegation.delegator] = delegation.delegate)
  );
  delegations
    .filter((delegation) => delegation.space !== '')
    .forEach(
      (delegation) =>
        (delegationsReverse[delegation.delegator] = delegation.delegate)
    );

  return Object.fromEntries(
    addresses.map((address) => [
      address,
      Object.entries(delegationsReverse)
        .filter(([, delegate]) => address.toLowerCase() === delegate)
        .map(([delegator]) => getAddress(delegator))
    ])
  );
}
