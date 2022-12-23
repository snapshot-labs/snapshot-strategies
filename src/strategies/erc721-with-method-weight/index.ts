import { multicall } from '../../utils';
import { Options } from './types';

export const author = 'pro100skm';
export const version = '0.0.1';

const abi = (methodName: string) => [
  `function ${methodName}(address addr, uint256 level) public view returns (uint256)`
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options: Options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const { address: contractAddress, methodName, levelsWeight } = options;

  const keys = Object.keys(levelsWeight);

  let weightSum = Array(keys.length).fill(0);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const weight = levelsWeight[key];
    const response = await multicall(
      network,
      provider,
      abi(methodName),
      addresses.map((address: any) => [
        contractAddress,
        methodName,
        [address, key]
      ]),
      { blockTag }
    );
    weightSum = weightSum.map(
      (v, i) => v + parseFloat(response[i].toString()) * weight
    );
  }

  return Object.fromEntries(weightSum.map((value, i) => [addresses[i], value]));
}
