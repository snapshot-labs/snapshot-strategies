/* eslint-disable @typescript-eslint/no-unused-vars */
import { Multicaller } from '../../utils';
import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';

export const author = 'PB';
export const version = '0.1.0';

// to interact with the staking and token contracts.
const stakingAbi = [
  'function depositsOf(address account) external view virtual override returns (uint256)'
];

export async function strategy(
  space: string,
  network: string,
  provider: any,
  addresses: string[],
  options: any,
  snapshot: number
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const stakingPool = new Multicaller(network, provider, stakingAbi, {
    blockTag
  });

  addresses.forEach((address) => {
    stakingPool.call(address, options.staking, 'depositsOf', [address]);
  });

  const result: Record<string, BigNumberish> = await stakingPool.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => {
      console.log(address, balance);
      return [address, parseFloat(formatUnits(balance, options.decimals))];
    })
  );
  // try {
  //   const [stakingResponse] = await Promise.all([stakingPool.execute()]);
  //   return Object.fromEntries(
  //     addresses.map((address) => {
  //       const stakingCount = stakingResponse[address].length;
  //       return [address, stakingCount];
  //     })
  //   );
  // } catch (error) {
  //   console.error('Error retrieving staking data:', error);
  //   return {};
  // }
}
