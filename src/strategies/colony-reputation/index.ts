import { call } from '../../utils';
import fetch from 'cross-fetch';

export const author = 'colony';
export const version = '0.1';

const colonyAbi = [
  'function getDomain(uint256 domainId) external view returns (uint256, uint256)'
];

const colonyNetworkAbi = [
  'function getReputationRootHash() external view returns (bytes32)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const rootHashAtBlock = await call(
    provider,
    colonyNetworkAbi,
    [options.colonyNetworkAddress, 'getReputationRootHash', []],
    { blockTag }
  );

  const domain = await call(
    provider,
    colonyAbi,
    [options.colonyAddress, 'getDomain', [1]],
    { blockTag }
  );

  const url = `https://xdai.colony.io/reputation/xdai/${rootHashAtBlock}/${options.colonyAddress}/${domain[0]}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });
  const data = await res.json();

  const retVal = {};

  addresses.forEach(function (address) {
    const loc = data.addresses.indexOf(address.toLowerCase());
    if (loc > -1) {
      retVal[address] = parseInt(data.reputations[loc], 10);
    } else {
      retVal[address] = 0;
    }
  });

  return retVal;
}
