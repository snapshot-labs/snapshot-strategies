import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'Tarnadas';
export const version = '0.1.0';

const ORDERLY_OMNIVAULT_ADDRESS = '0x7819704B69a38fD63Cc768134b8410dc08B987D0';
const ORDERLY_DECIMALS = 18;

const abi = [
  'function getStakingInfo(address _user) external view returns (uint256 orderBalance, uint256 esOrderBalance)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses: string[],
  options,
  snapshot: number | 'latest'
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, {
    blockTag
  });

  addresses.forEach((address) =>
    multi.call(address, ORDERLY_OMNIVAULT_ADDRESS, 'getStakingInfo', [address])
  );

  const result: Record<string, [BigNumberish, BigNumberish]> =
    await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, stakingInfo]) => {
      const orderBalance = stakingInfo[0];
      const esOrderBalance = stakingInfo[1];
      const totalScore =
        parseFloat(formatUnits(orderBalance, ORDERLY_DECIMALS)) +
        parseFloat(formatUnits(esOrderBalance, ORDERLY_DECIMALS));
      return [address, totalScore];
    })
  );
}
