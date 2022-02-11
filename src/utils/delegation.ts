import { getAddress } from '@ethersproject/address';
import { subgraphRequest, SNAPSHOT_SUBGRAPH_URL } from '../utils';

export async function getDelegations(space, network, addresses, snapshot) {
  const addressesLc = addresses.map((addresses) => addresses.toLowerCase());
  const spaceIn = ['', space];
  if (space.includes('.eth')) spaceIn.push(space.replace('.eth', ''));

  const PAGE_SIZE = 1000;
  let result = [];
  let page = 0;
  const params = {
    delegations: {
      __args: {
        where: {
          // delegate_in: addressesLc,
          // delegator_not_in: addressesLc,
          space_in: spaceIn
        },
        first: PAGE_SIZE,
        skip: 0
      },
      delegator: true,
      space: true,
      delegate: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.delegations.__args.block = { number: snapshot };
  }
  while (true) {
    params.delegations.__args.skip = page * PAGE_SIZE;

    const pageResult = await subgraphRequest(
      SNAPSHOT_SUBGRAPH_URL[network],
      params
    );
    result = result.concat(pageResult.delegations);
    page++;
    if (pageResult.delegations.length < PAGE_SIZE) break;
  }
  const delegations = result.filter(
    (delegation: any) =>
      addressesLc.includes(delegation.delegate) &&
      !addressesLc.includes(delegation.delegator)
  );
  if (!delegations) return {};

  const delegationsReverse = {};
  delegations.forEach(
    (delegation: any) =>
      (delegationsReverse[delegation.delegator] = delegation.delegate)
  );
  delegations
    .filter((delegation: any) => delegation.space !== '')
    .forEach(
      (delegation: any) =>
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
