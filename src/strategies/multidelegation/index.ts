import {
  getAddressTotalDelegatedScore,
  getDelegationAddresses,
  getLegacyDelegations,
  getPolygonMultiDelegations,
  mergeDelegations,
  reverseDelegations
} from './utils';
import { getScoresDirect } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'ncomerci';
export const version = '0.1.0';
export const dependOnOtherAddress = true;

const MULTI_DELEGATION_ENV = {
  mainnet: { polygonChainId: '137', subgraphUrl: '' },
  mumbai: {
    polygonChainId: '80001',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/1emu/multi-delegation-polygon'
  }
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const delegationSpace = options.delegationSpace || space;
  const checksummedAddresses = addresses.map(getAddress);

  const multiDelegationEnv =
    (options?.polygonChain && MULTI_DELEGATION_ENV[options.polygonChain]) ||
    MULTI_DELEGATION_ENV.mumbai;

  // Retro compatibility with the legacy delegation strategy
  const legacyDelegationsPromise = getLegacyDelegations(
    delegationSpace,
    network,
    checksummedAddresses,
    snapshot
  );
  const multiDelegationsPromise = getPolygonMultiDelegations(
    multiDelegationEnv,
    network,
    snapshot,
    provider,
    delegationSpace
  );

  const [legacyDelegations, multiDelegations] = await Promise.all([
    legacyDelegationsPromise,
    multiDelegationsPromise
  ]);

  const isLegacyDelegationEmpty = legacyDelegations.size === 0;
  const isMultiDelegationEmpty = multiDelegations.size === 0;

  if (isLegacyDelegationEmpty && isMultiDelegationEmpty) {
    return Object.fromEntries(
      checksummedAddresses.map((address) => [address, 0])
    );
  }

  const mergedDelegations = mergeDelegations(
    legacyDelegations,
    multiDelegations
  );
  const reversedDelegations = reverseDelegations(mergedDelegations);
  const delegationAddresses = getDelegationAddresses(reversedDelegations);

  const scores = (
    await getScoresDirect(
      space,
      options.strategies || [],
      network,
      provider,
      delegationAddresses,
      snapshot
    )
  ).filter((score) => Object.keys(score).length !== 0);

  return Object.fromEntries(
    checksummedAddresses.map((delegate) => {
      return getAddressTotalDelegatedScore(
        delegate,
        mergedDelegations,
        reversedDelegations,
        scores
      );
    })
  );
}
