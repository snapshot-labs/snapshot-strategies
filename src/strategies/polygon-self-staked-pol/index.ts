import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'maticnetwork';
export const version = '0.1.0';

const stakeManagerABI = [
  'function getValidatorContract(uint256) view returns (address)',
  'function validators(uint256) view returns (uint256 amount, uint256 reward, uint256 activationEpoch, uint256 deactivationEpoch, uint256 jailTime, address signer, address contractAddress, uint8 status, uint256 commissionRate, uint256 lastCommissionUpdate, uint256 delegatorsReward, uint256 delegatedAmount, uint256 initialRewardPerStake)',
  'function currentEpoch() view returns (uint256)',
  'function NFTCounter() view returns (uint256)'
];

const validatorShareABI = [
  'function getTotalStake(address) view returns (uint256, uint256)'
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
  const uniqueAddresses = new Set<string>(addresses);

  const multi = new Multicaller(network, provider, stakeManagerABI, {
    blockTag
  });

  multi.call('currentEpoch', options.stakeManagerAddress, 'currentEpoch');
  multi.call('nftCounter', options.stakeManagerAddress, 'NFTCounter');

  const initialResult = await multi.execute();
  const currentEpoch = initialResult.currentEpoch.toNumber();
  const validatorCount = initialResult.nftCounter.toNumber();

  for (let i = 0; i < validatorCount; i++) {
    multi.call(
      `validator${i}`,
      options.stakeManagerAddress,
      'getValidatorContract',
      [i]
    );
    multi.call(`validatorInfo${i}`, options.stakeManagerAddress, 'validators', [
      i
    ]);
  }

  const result = await multi.execute();

  const votingPower: Record<string, BigNumber> = {};
  for (const address of uniqueAddresses) {
    votingPower[address] = BigNumber.from(0);
  }

  const stakesMulti = new Multicaller(network, provider, validatorShareABI, {
    blockTag
  });

  for (let i = 1; i < validatorCount; i++) {
    const validatorContract = result[`validator${i}`];
    const validatorInfo = result[`validatorInfo${i}`];

    const isNotDeactivated =
      validatorInfo.deactivationEpoch.eq(0) ||
      validatorInfo.deactivationEpoch.gt(currentEpoch);

    if (
      isNotDeactivated &&
      validatorContract !== '0x0000000000000000000000000000000000000000'
    ) {
      for (const address of uniqueAddresses) {
        stakesMulti.call(
          `${address}_${i}`,
          validatorContract,
          'getTotalStake',
          [address]
        );
      }
    }
  }

  const stakes = await stakesMulti.execute();

  for (const address of uniqueAddresses) {
    for (let i = 0; i < validatorCount; i++) {
      const key = `${address}_${i}`;
      if (stakes[key]) {
        votingPower[address] = votingPower[address].add(stakes[key][0]);
      }
    }
  }

  return Object.fromEntries(
    Object.entries(votingPower).map(([address, power]) => [
      getAddress(address),
      parseFloat(formatUnits(power, options.decimals))
    ])
  );
}
