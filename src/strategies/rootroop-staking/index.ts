import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import abi from './xRooStakingABI.json';

export const author = 'animalmix55';
export const version = '0.0.1';

interface UserData {
  stake: BigNumberish;
  liquidity: BigNumberish;
  lastTimestamp: BigNumberish;
  RTRewardModifier: BigNumberish;
  NFTXRewardModifier: BigNumberish;
  NFTXRewardWithdrawn: BigNumberish;
}

interface Params {
  address: string;
  decimals: number;
  symbol: string;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options: Params,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, options.address, 'users', [address])
  );
  const result: Record<string, UserData> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, userData]) => [
      address,
      parseFloat(formatUnits(userData.stake, options.decimals))
    ])
  );
}
