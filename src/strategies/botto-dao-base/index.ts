import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'agustinjch';
export const version = '1.0.0';

const abi = [
  'function userStakes(address) external view returns(uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>[]> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const _formatUnits = (value) =>
    parseFloat(formatUnits(value, options.decimals));

  const multiBalances = new Multicaller(network, provider, abi, {
    blockTag
  });

  addresses.forEach((address) => {
    multiBalances.call(
      address + '-stakedBotto',
      options.stakingAddress,
      'userStakes',
      [address]
    );
  });

  const balances: Record<string, BigNumberish> = await multiBalances.execute();

  const result = Object.fromEntries(
    addresses.map((adr) => {
      const stakedBotto = _formatUnits(balances[adr + '-stakedBotto'] || 0);
      return [adr, stakedBotto];
    })
  );

  return [result];
}
