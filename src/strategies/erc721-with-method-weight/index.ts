import { Multicaller } from '../../utils';
import { Options } from './types';
import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';

export const author = 'pro100skm';
export const version = '0.0.1';

const abi = (methodName: string) => [
  `function ${methodName}(address addr) public view returns (uint256)`
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
  const { address: contractAddress, methodName } = options;

  const multi = new Multicaller(network, provider, abi(methodName), {
    blockTag
  });
  addresses.forEach((address) =>
    multi.call(address, contractAddress, methodName, [address])
  );
  const result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, 0))
    ])
  );
}
