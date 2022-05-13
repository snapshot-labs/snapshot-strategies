import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.1';

let StakingRewardAbi = [{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"calculateSharesValueInState","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}, ]

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, StakingRewardAbi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, options.address, 'calculateSharesValueInState', [address])
  );
  const result: Record<string, BigNumberish> = await multi.execute();


  let data = Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      (parseFloat(formatUnits(balance, options.decimals)))
    ])
  )
  return data;
}
