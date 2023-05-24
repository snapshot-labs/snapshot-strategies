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
): Promise<Map<string, string[]>> {
  const delegatesBySpace = await getPolygonDelegatesBySpace(
    network,
    space,
    snapshot
  );

  return delegatesBySpace.reduce((accum, delegation) => {
    const delegator = getAddress(delegation.delegator);
    const delegate = getAddress(delegation.delegate);
    const existingDelegates = accum.get(delegator) || [];
    accum.set(delegator, [...existingDelegates, delegate]);
    return accum;
  }, new Map<string, string[]>());
}

export async function getLegacyDelegations(
  space: string,
  network: string,
  addresses: string[],
  snapshot: string
): Promise<Map<string, string>> {
  const delegatesBySpace = await getDelegatesBySpace(network, space, snapshot);
  const delegationsReverse = new Map<string, string>();

  delegatesBySpace.forEach((delegation: any) => {
    const delegator = delegation.delegator.toLowerCase();
    const delegate = delegation.delegate.toLowerCase();
    delegationsReverse.set(delegator, delegate);
  });

  delegatesBySpace
    .filter((delegation: any) => delegation.space !== '')
    .forEach((delegation: any) => {
      const delegator = delegation.delegator.toLowerCase();
      const delegate = delegation.delegate.toLowerCase();
      delegationsReverse.set(delegator, delegate);
    });

  const result = new Map<string, string>();
  addresses.forEach((address) => {
    const addressLc = address.toLowerCase();
    const delegate = delegationsReverse.get(addressLc);
    if (!!delegate) {
      const delegator = getAddress(addressLc);
      result.set(delegator, getAddress(delegate));
    }
  });

  return result;
}

// legacy and multi delegations are both objects with delegator as key and delegate(s) as value
export function mergeDelegations(
  legacyDelegations: Map<string, string>,
  multiDelegations: Map<string, string[]>
): Map<string, string[]> {
  const mergedDelegations: Map<string, string[]> = new Map();

  const delegators = new Set([
    ...(legacyDelegations?.keys() || []),
    ...(multiDelegations?.keys() || [])
  ]);

  for (const delegator of delegators) {
    const legacyDelegate = legacyDelegations.get(delegator);
    const multiDelegates = multiDelegations.get(delegator);

    // Check if multiDelegations has a list for the current address
    if (multiDelegates && multiDelegates.length > 0) {
      mergedDelegations.set(delegator, multiDelegates);
    } else if (legacyDelegate) {
      mergedDelegations.set(delegator, [legacyDelegate]);
    }
  }

  return mergedDelegations;
}
