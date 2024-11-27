import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { ADDRESS_ZERO } from '@uniswap/v3-sdk';

export const author = 'Jean-Grimal';
export const version = '0.1.1';

const abi = [
  'function delegatedVotingPower(address account) external view returns (uint256)',
  'function delegatee(address delegatee) public view returns (uint256)',
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

  const delegatedVotingPowerMulti = new Multicaller(network, provider, abi, {
    blockTag
  });
  const delegateeMulti = new Multicaller(network, provider, abi, { blockTag });
  const balanceOfMulti = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) => {
    delegatedVotingPowerMulti.call(
      address,
      options.address,
      'delegatedVotingPower',
      [address]
    );
    delegateeMulti.call(address, options.address, 'delegatee', [address]);
    balanceOfMulti.call(address, options.address, 'balanceOf', [address]);
  });
  const [delegatedVotingPowerResult, delegateeResult, balanceOfResult] =
    await Promise.all([
      delegatedVotingPowerMulti.execute(),
      delegateeMulti.execute(),
      balanceOfMulti.execute()
    ]);

  return Object.fromEntries(
    Object.entries(delegatedVotingPowerResult).map(([address, votingData]) => [
      address,
      parseFloat(
        formatUnits(
          delegatedVotingPowerResult[address] +
            (delegateeResult[address].delegatee === ADDRESS_ZERO
              ? balanceOfResult[address].balanceOf
              : 0n),
          options.decimals
        )
      )
    ])
  );
}
