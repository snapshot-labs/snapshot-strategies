import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'Vivek205';
export const version = '0.1.0';

type StakeInfoResponse = {
  found: boolean;
  approvedAmount: BigNumber;
  pendingForApprovalAmount: BigNumber;
  rewardComputeIndex: BigNumber;
  claimableAmount: BigNumber;
};

type StakeResult = Record<string, StakeInfoResponse>;

const stakingAbi = [
  'function getStakeInfo(uint256 stakeMapIndex, address staker) public view returns (bool found, uint256 approvedAmount, uint256 pendingForApprovalAmount, uint256 rewardComputeIndex, uint256 claimableAmount)'
];

const parseNumber = (value: BigNumberish): BigNumber => BigNumber.from(value);

const parseStakeInfo = (value: StakeInfoResponse) => ({
  approvedAmount: parseNumber(value.approvedAmount),
  pendingApprovalAmount: parseNumber(value.pendingForApprovalAmount)
});

const computeStakeBalance = (value: StakeInfoResponse) => {
  const { approvedAmount, pendingApprovalAmount } = parseStakeInfo(value);
  return approvedAmount.add(pendingApprovalAmount);
};

const multiCallerFactory = (network, provider, blockTag) => (abi) =>
  new Multicaller(network, provider, abi, { blockTag });

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const { stakingAddress, stakeMapIndex } = options;

  const initMultiCaller = multiCallerFactory(network, provider, blockTag);

  const stakingInfoCaller = initMultiCaller(stakingAbi);

  addresses.forEach((address) => {
    stakingInfoCaller.call(address, stakingAddress, 'getStakeInfo', [
      stakeMapIndex,
      address
    ]);
  });

  const stakingInfoResult: StakeResult = await stakingInfoCaller.execute();

  return Object.fromEntries(
    addresses.map((address) => {
      const stakeBalance = computeStakeBalance(stakingInfoResult[address]);
      return [address, parseFloat(formatUnits(stakeBalance, options.decimals))];
    })
  );
}
