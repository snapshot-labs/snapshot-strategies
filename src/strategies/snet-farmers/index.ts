import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'Vivek205';
export const version = '0.1.0';

type UserInfoResponse = {
  amount: BigNumber;
  rewardDebt: BigNumber;
};

type FarmResult = Record<string, UserInfoResponse>;

const farmingAbi = [
  'function userInfo(uint256 poolid, address account) external view returns (uint256 amount, int256 rewardDebt)'
];

const parseNumber = (value: BigNumberish): BigNumber => BigNumber.from(value);

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
  const { farmingAddress, farmingPoolId } = options;

  const initMultiCaller = multiCallerFactory(network, provider, blockTag);
  const farmingInfoCaller = initMultiCaller(farmingAbi);

  addresses.forEach((address) => {
    farmingInfoCaller.call(address, farmingAddress, 'userInfo', [
      farmingPoolId,
      address
    ]);
  });

  const farmingInfoResult: FarmResult = await farmingInfoCaller.execute();

  return Object.fromEntries(
    addresses.map((address) => {
      const farmingBalance = parseNumber(farmingInfoResult[address].amount);
      return [
        address,
        parseFloat(formatUnits(farmingBalance, options.decimals))
      ];
    })
  );
}
