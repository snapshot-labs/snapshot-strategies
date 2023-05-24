import {
  getLegacyDelegations,
  getMultiDelegations,
  mergeDelegations
} from './utils';
import { getSnapshots } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'dcl-DAO';
export const version = '0.1.0';
export const dependOnOtherAddress = true;

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
  // Retro compatibility with the legacy delegation strategy
  const legacyDelegationsPromise = getLegacyDelegations(
    'snapshot.dcl.eth',
    network,
    checksummedAddresses,
    snapshot
  );

  const polygonChainId = '80001';
  const blocks = await getSnapshots(network, snapshot, provider, [
    polygonChainId
  ]);

  const polygonBlockNumber = blocks[polygonChainId];

  const multiDelegationsPromise = getMultiDelegations(
    delegationSpace,
    network,
    checksummedAddresses,
    polygonBlockNumber
  );

  const [legacyDelegations, multiDelegations] = await Promise.all([
    legacyDelegationsPromise,
    multiDelegationsPromise
  ]);
  console.log('legacyDelegations', legacyDelegations);
  console.log('multiDelegations', multiDelegations);

  const isLegacyDelegationEmpty = legacyDelegations.size === 0;
  const isMultiDelegationEmpty = multiDelegations.size === 0;

  if (isLegacyDelegationEmpty && isMultiDelegationEmpty) return {};

  const mergedDelegations = mergeDelegations(
    legacyDelegations,
    multiDelegations
  );

  console.log('mergedDelegations', mergedDelegations);

  return mergedDelegations;

  // // TODO: check if getScoresDirect can be called with multiDelegations
  // const scores = (
  //   await getScoresDirect(
  //     space,
  //     options.strategies,
  //     network,
  //     provider,
  //     Object.values(multiDelegations).reduce((a: string[], b: string[]) =>
  //       a.concat(b)
  //     ),
  //     snapshot
  //   )
  // ).filter((score) => Object.keys(score).length !== 0);
  //
  // return Object.fromEntries(
  //   addresses.map((address) => {
  //     const addressScore =
  //       legacyDelegations[address] ||
  //       (multiDelegations[address]
  //         ? multiDelegations[address].reduce(
  //             (a, b) => a + scores.reduce((x, y) => (y[b] ? x + y[b] : x), 0),
  //             0
  //           )
  //         : 0);
  //     return [address, addressScore];
  //   })
  // );
}
