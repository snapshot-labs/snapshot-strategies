import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export async function getDelegatesBySpace(
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
    params.delegations.__args.block = { number: snapshot };
  }

  while (true) {
    params.delegations.__args.skip = page * PAGE_SIZE;

    const pageResult = await subgraphRequest(
      'https://api.thegraph.com/subgraphs/name/andyesp/multi-delegation',
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
  const delegatesBySpace = await getDelegatesBySpace(network, space, snapshot);

  const delegationsReverse: Record<string, Set<string>> = {};
  delegatesBySpace.forEach(
    (delegation) =>
      (delegationsReverse[delegation.delegator] = new Set([
        ...(delegationsReverse[delegation.delegator] || []),
        delegation.delegate
      ]))
  );

  return Object.fromEntries(
    addresses.map((address) => [
      address.toLowerCase(),
      Object.entries(delegationsReverse)
        .filter(([, delegates]) => delegates.has(address.toLowerCase()))
        .map(([delegator]) => getAddress(delegator))
    ])
  );
}
