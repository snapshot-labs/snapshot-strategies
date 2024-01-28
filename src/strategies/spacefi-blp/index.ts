import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'SpaceFinance';
export const version = '0.1.0';

const abi = [
  'function userInfo(address account) external view returns (uint256,uint256,uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const { blpAddress, decimals } = options;

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, blpAddress, 'userInfo', [address])
  );
  const result: Record<string, [BigNumberish, BigNumberish, BigNumberish]> =
    await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, blp]) => [
      address,
      Number(formatUnits(blp[0], decimals)) +
        Number(formatUnits(blp[2], decimals))
    ])
  );
}
