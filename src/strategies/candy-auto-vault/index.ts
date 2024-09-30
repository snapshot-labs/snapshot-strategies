import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { multicall, Multicaller } from '../../utils';

export const author = 'dramacrypto';
export const version = '0.1.0';

const vaultAbi = [
  'function getPricePerFullShare() external view returns (uint256)',
  'function calculatePerformanceFee(address _user) public view returns (uint256)',
  'function calculateOverdueFee(address _user) public view returns (uint256)',
  'function userInfo(address account) external view returns (uint256 shares, uint256 lastDepositedTime, uint256 candyAtLastUserAction, uint256 lastUserActionTime, uint256 lockStartTime, uint256 lockEndTime, uint256 userBoostedShare, bool locked, uint256 lockedAmount)'
];

interface UserInfo {
  shares: BigNumber;
  lastDepositedTIme: BigNumber;
  candyAtLastUserAction: BigNumber;
  lastUserActionTime: BigNumber;
  lockStartTime: BigNumber;
  lockEndTime: BigNumber;
  userBoostedShare: BigNumber;
  locked: boolean;
  lockedAmount: BigNumber;
}

function convertSharesToCandy(
  shares: BigNumber,
  pricePerFullShare: BigNumber,
  decimals = 18,
  fee?: BigNumber
): number {
  const amountCandyBigNumber = shares
    .mul(pricePerFullShare)
    .div(BigNumber.from(10).pow(decimals))
    .sub(fee || BigNumber.from(0));
  const amountCandyAsNumber = parseFloat(
    formatUnits(amountCandyBigNumber, decimals)
  );
  return amountCandyAsNumber;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // get price per full share
  const pricePerFullShare = await multicall(
    network,
    provider,
    vaultAbi,
    [[options.address, 'getPricePerFullShare', []]],
    { blockTag }
  );

  // get user info
  const userInfoMulti = new Multicaller(network, provider, vaultAbi, {
    blockTag
  });
  addresses.forEach((address) =>
    userInfoMulti.call(address, options.address, 'userInfo', [address])
  );
  const userInfosResult: Record<string, UserInfo> =
    await userInfoMulti.execute();

  // calculate performance fee
  const performanceFeeMulti = new Multicaller(network, provider, vaultAbi, {
    blockTag
  });
  addresses.forEach((address) =>
    performanceFeeMulti.call(
      address,
      options.address,
      'calculatePerformanceFee',
      [address]
    )
  );
  const performanceFeesResult: Record<string, BigNumberish> =
    await performanceFeeMulti.execute();

  // calculate overdue fee
  const overdueFeeMulti = new Multicaller(network, provider, vaultAbi, {
    blockTag
  });
  addresses.forEach((address) =>
    overdueFeeMulti.call(address, options.address, 'calculateOverdueFee', [
      address
    ])
  );
  const overdueFeesResult: Record<string, BigNumberish> =
    await overdueFeeMulti.execute();

  return Object.fromEntries(
    Object.entries(userInfosResult).map(([address, userInfo]) => {
      const userBalance = convertSharesToCandy(
        BigNumber.from(userInfo.shares.toString()),
        pricePerFullShare[0].toString(),
        options.decimals,
        BigNumber.from(overdueFeesResult[address])
          .add(performanceFeesResult[address])
          .add(userInfo.userBoostedShare)
      );
      return [address, userBalance];
    })
  );
}
