import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'stzky';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
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

  const multiMembership = new Multicaller(network, provider, abi, {
    blockTag
  });
  const multiToken = new Multicaller(network, provider, abi, {
    blockTag
  });
  addresses.forEach((address) =>
    multiMembership.call(address, options.membershipAddress, 'balanceOf', [
      address
    ])
  );
  const members: Record<string, BigNumberish> = await multiMembership.execute();

  addresses.forEach((address) =>
    multiToken.call(address, options.tokenAddress, 'balanceOf', [address])
  );
  const result: Record<string, BigNumberish> = await multiToken.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals)) *
        (Number(members[address].toString()) > 0 ? 1 : 0)
    ])
  );
}
