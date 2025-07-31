import { getAddress } from '@ethersproject/address';
import {
  getDelegatesBySpace,
  getSnapshots,
  subgraphRequest
} from '../../utils';

export async function getPolygonDelegatesBySpace(
  subgraphUrl: string,
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

    const pageResult = await subgraphRequest(subgraphUrl, params);
    const pageDelegations = pageResult.delegations || [];
    result = result.concat(pageDelegations);
    page++;
    if (pageDelegations.length < PAGE_SIZE) break;
  }

  return result;
}

export async function getMultiDelegations(
  subgraphUrl: string,
  space: string,
  snapshot?: string
): Promise<Map<string, string[]>> {
  const delegatesBySpace = await getPolygonDelegatesBySpace(
    subgraphUrl,
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

export async function getSingleDelegations(
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

    if (multiDelegates && multiDelegates.length > 0) {
      mergedDelegations.set(delegator, multiDelegates);
    } else if (legacyDelegate) {
      mergedDelegations.set(delegator, [legacyDelegate]);
    }
  }

  return mergedDelegations;
}

// delegations is an object with delegator as key and delegate(s) as value
export function reverseDelegations(delegations: Map<string, string[]>) {
  const invertedDelegations = new Map<string, string[]>();

  for (const [delegator, delegates] of delegations) {
    for (const delegate of delegates) {
      if (invertedDelegations.has(delegate)) {
        invertedDelegations.get(delegate)?.push(delegator);
      } else {
        invertedDelegations.set(delegate, [delegator]);
      }
    }
  }

  return invertedDelegations;
}

export function getDelegatorScores(
  scores: Record<string, number>[],
  delegatorAddress: string
) {
  return scores.reduce((strategiesAcumScore, strategyScores) => {
    return strategyScores[delegatorAddress] !== undefined
      ? strategiesAcumScore + strategyScores[delegatorAddress]
      : strategiesAcumScore;
  }, 0);
}

export function getDelegateScore(
  delegations: string[],
  scores: Record<string, number>[],
  mergedDelegations: Map<string, string[]>
) {
  return delegations.reduce((delegationsAcumScore, delegatorAddress) => {
    const delegatorDelegations = mergedDelegations.get(delegatorAddress);
    const delegationsAmount = delegatorDelegations?.length || 1;
    return (
      delegationsAcumScore +
      getDelegatorScores(scores, delegatorAddress) / delegationsAmount
    );
  }, 0);
}

export function getAddressTotalDelegatedScore(
  delegate,
  mergedDelegations: Map<string, string[]>,
  reversedDelegations: Map<string, string[]>,
  scores
) {
  const delegations = reversedDelegations.get(delegate);
  const delegateScore = delegations
    ? getDelegateScore(delegations, scores, mergedDelegations)
    : 0;
  return [delegate, delegateScore];
}

export async function getPolygonBlockNumber(
  polygonChainId,
  network,
  snapshot,
  provider
) {
  const blocks = await getSnapshots(network, snapshot, provider, [
    polygonChainId
  ]);
  return blocks[polygonChainId];
}

export async function getPolygonMultiDelegations(
  multiDelegationEnv,
  network,
  snapshot,
  provider,
  delegationSpace
) {
  const polygonBlockNumber = await getPolygonBlockNumber(
    multiDelegationEnv.polygonChainId,
    network,
    snapshot,
    provider
  );

  return getMultiDelegations(
    multiDelegationEnv.subgraphUrl,
    delegationSpace,
    polygonBlockNumber
  );
}

export function getDelegationAddresses(
  reversedDelegations: Map<string, string[]>
) {
  return Array.from(
    Array.from(reversedDelegations.values()).reduce(
      (accumulator, addresses) => new Set([...accumulator, ...addresses]),
      new Set<string>()
    )
  );
}
