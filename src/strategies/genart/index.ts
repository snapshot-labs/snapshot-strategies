import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'stzky';
export const version = '0.2.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function getMembershipsOf(address account) external view returns (uint256[] memory)',
  'function getStake(address user) external view returns (uint256,uint256[] memory,uint256,uint256)'
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
  const multiStake = new Multicaller(network, provider, abi, {
    blockTag
  });

  addresses.forEach((address) =>
    multiMembership.call(
      address,
      options.interfaceAddress,
      'getMembershipsOf',
      [address]
    )
  );

  addresses.forEach((address) =>
    multiToken.call(address, options.tokenAddress, 'balanceOf', [address])
  );

  addresses.forEach((address) =>
    multiStake.call(address, options.vaultAddress, 'getStake', [address])
  );

  const members: Record<string, BigNumberish[]> =
    await multiMembership.execute();

  const tokens: Record<string, BigNumberish> = await multiToken.execute();

  const stakes: Record<
    string,
    [BigNumberish, BigNumberish[], BigNumberish, BigNumberish]
  > = await multiStake.execute();

  return Object.fromEntries(
    Object.entries(tokens).map(([address, balance]) => [
      address,
      (Number(formatUnits(balance, options.decimals)) +
        Number(formatUnits(stakes[address][0], options.decimals))) *
        (members[address].length > 0 ? 1 : 0)
    ])
  );
}
