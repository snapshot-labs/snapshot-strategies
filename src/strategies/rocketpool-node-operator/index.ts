import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'rocket-pool';
export const version = '0.1.1';

const rocketNodeStakingAddress = '0x3019227b2b8493e45Bf5d25302139c9a2713BF15';
const rocketNodeStakingContractAbi = [
  'function getNodeEffectiveRPLStake(address _nodeAddress) external view returns (uint256)'
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

  const effectiveStake = new Multicaller(
    network,
    provider,
    rocketNodeStakingContractAbi,
    { blockTag }
  );

  addresses.forEach((address) => {
    effectiveStake.call(
      address,
      rocketNodeStakingAddress,
      'getNodeEffectiveRPLStake',
      [address]
    );
  });

  const effectiveStakeResponse: Record<string, BigNumberish> =
    await effectiveStake.execute();

  return Object.fromEntries(
    Object.entries(effectiveStakeResponse).map(([address, balance]) => [
      address,
      Math.sqrt(parseFloat(formatUnits(balance, options.decimals))) / 2
    ])
  );
}
