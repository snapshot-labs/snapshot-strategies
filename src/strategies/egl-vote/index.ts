import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'shanevc';
export const version = '0.1';

const lockedTokenBalance = [
  'function voters(address) view returns (uint8,uint16,uint256,uint256,uint256)'
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
  const { eglVotingAddress, decimals } = options;

  const eglBalances = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  const lockedTokenBalances = new Multicaller(
    network,
    provider,
    lockedTokenBalance,
    { blockTag }
  );

  addresses.forEach((address) =>
    lockedTokenBalances.call(address, eglVotingAddress, 'voters', [address])
  );
  const result: Record<
    string,
    Array<number | BigNumberish>
  > = await lockedTokenBalances.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, voter]) => [
      address,
      parseFloat(formatUnits(voter[3], decimals)) + eglBalances[address]
    ])
  );
}
