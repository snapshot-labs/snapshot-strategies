import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'dramacrypto';
export const version = '0.1.0';

const abi = [
  'function lockCount(address account_) external view returns (uint256)',
  'function viewLocks(address account_, uint256 offset_, uint256 count_) external view returns (tuple(uint256 lid, uint256 amount, uint256 lockAt, uint256 duration, uint256 lastRewardAt, bool unlocked, uint256[] nfts)[])'
];

interface LockData {
  lid: BigNumber;
  unlocked: boolean;
  amount: BigNumber;
  lockAt: BigNumber;
  duration: BigNumber;
  lastRewardAt: BigNumber;
  nfts: BigNumber[];
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

  const lockCountMulti = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    lockCountMulti.call(address, options.address, 'lockCount', [address])
  );
  const lockCountsResult: Record<string, BigNumber> =
    await lockCountMulti.execute();
  const lockCounts = Object.entries(lockCountsResult).map(
    ([address, lockCount]) => [address, parseFloat(formatUnits(lockCount, 0))]
  );

  const lockDataMulti = new Multicaller(network, provider, abi, { blockTag });
  lockCounts.forEach(([address, lockCount]) =>
    lockDataMulti.call(address, options.address, 'viewLocks', [
      address,
      0,
      lockCount
    ])
  );
  const lockDatasMulti: Record<string, any> = await lockDataMulti.execute();

  return Object.fromEntries(
    Object.entries(lockDatasMulti).map(([address, userLocks]) => {
      const userLockedTokenAmount = userLocks
        .filter((userLock: LockData) => !userLock.unlocked)
        .reduce(
          (cur, acc: LockData) =>
            cur + parseFloat(formatUnits(acc.amount, options.decimals)),
          0
        );
      return [address, userLockedTokenAmount];
    })
  );
}
