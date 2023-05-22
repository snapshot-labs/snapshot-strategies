// @ts-nocheck
import { getMultiDelegations } from './utils';
import { getDelegations } from '../../utils/delegation';
import fetch from 'cross-fetch';

export const author = 'dcl-DAO';
export const version = '0.1.0';
export const dependOnOtherAddress = true;

async function getPolygonBlockNumber(snapshot) {
  const result = await fetch(
    `https://api.etherscan.io/api?module=block&action=getblockreward&blockno=${snapshot}`
  );

  const fullResult = await result.json();
  const timestamp = fullResult.result.timeStamp;
  const anotherResult = await fetch(
    `https://api-testnet.polygonscan.com/api?module=block&action=getblocknobytime&timestamp=${timestamp}&closest=before`
  );

  const anotherFullResult = await anotherResult.json();
  return anotherFullResult.result;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const delegationSpace = options.delegationSpace || space;

  // Retro compatibility with the legacy delegation strategy
  const legacyDelegationsPromise = getDelegations(
    'lemu.dcl.eth',
    1,
    addresses,
    snapshot
  );

  const polygonBlockNumber = await getPolygonBlockNumber(snapshot);
  const multiDelegationsPromise = getMultiDelegations(
    delegationSpace,
    network,
    addresses,
    polygonBlockNumber
  );

  const [legacyDelegations, multiDelegations] = await Promise.all([
    legacyDelegationsPromise,
    multiDelegationsPromise
  ]);

  const isLegacyDelegationEmpty = Object.keys(legacyDelegations).length === 0;
  const isMultiDelegationEmpty = Object.keys(multiDelegations).length === 0;

  if (isLegacyDelegationEmpty && isMultiDelegationEmpty) return {};

  return [legacyDelegations, multiDelegations];

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
