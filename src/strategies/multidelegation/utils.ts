import { getAddress } from '@ethersproject/address';
import { getDelegatesBySpace, subgraphRequest } from '../../utils';

export async function getPolygonDelegatesBySpace(
  network: string,
  space: string,
  snapshot = 'latest'
) {
  const spaceIn = ['', space];
  if (space.includes('.eth')) spaceIn.push(space.replace('.eth', ''));

  const PAGE_SIZE = 1000;
  let result: { delegator: string; space: string; delegate: string }[] = [];
  let page = 0;
  const params: any = {
    delegations: {
      __args: {
        where: {
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
    params.delegations.__args.block = { number: Number(snapshot) };
  }

  while (true) {
    params.delegations.__args.skip = page * PAGE_SIZE;

    const pageResult = await subgraphRequest(
      'https://api.thegraph.com/subgraphs/name/1emu/multi-delegation-polygon',
      params
    );
    const pageDelegations = pageResult.delegations || [];
    result = result.concat(pageDelegations);
    page++;
    if (pageDelegations.length < PAGE_SIZE) break;
  }

  return result;
}

export async function getMultiDelegations(
  space: string,
  network: string,
  addresses: string[],
  snapshot?: string
): Promise<{
  [k: string]: any;
}> {
  const delegatesBySpace = await getPolygonDelegatesBySpace(
    network,
    space,
    snapshot
  );

  const delegationsReverse = delegatesBySpace.reduce((accum, delegation) => {
    const delegator = getAddress(delegation.delegator);
    accum[delegator] = [
      ...(accum[delegator] || []),
      getAddress(delegation.delegate)
    ];
    return accum;
  }, {} as Record<string, string[]>);

  return delegationsReverse;
}

export async function getLegacyDelegations(
  space,
  network,
  addresses,
  snapshot
) {
  const delegatesBySpace = await getDelegatesBySpace(network, space, snapshot);
  const delegationsReverse = {};
  delegatesBySpace.forEach(
    (delegation: any) =>
      (delegationsReverse[delegation.delegator] = delegation.delegate)
  );
  delegatesBySpace
    .filter((delegation: any) => delegation.space !== '')
    .forEach(
      (delegation: any) =>
        (delegationsReverse[delegation.delegator] = delegation.delegate)
    );

  const result = {};
  addresses.forEach((address) => {
    const addressLc = address.toLowerCase();
    if (delegationsReverse[addressLc]) {
      result[getAddress(addressLc)] = getAddress(delegationsReverse[addressLc]);
    }
  });

  return result;
}
