import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'JD0x2e';
export const version = '0.1.2';

const mfdAbi = [
  'function getUserLocks(address) view returns (tuple(uint256 amount, uint256 unlockTime, uint256 multiplier, uint256 duration, uint256 lockCreationTime)[])'
];

const erc20Abi = ['function balanceOf(address) view returns (uint256)'];

const toJsNum = (bn: BigNumberish) => parseFloat(formatUnits(bn));

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const MFD_CONTRACT = options.lockingContract;
  const HOME_TOKEN = options.homeToken;

  const locksMulticaller = new Multicaller(network, provider, mfdAbi, {
    blockTag
  });
  const homeMulticaller = new Multicaller(network, provider, erc20Abi, {
    blockTag
  });

  addresses.forEach((address) => {
    locksMulticaller.call(address, MFD_CONTRACT, 'getUserLocks', [address]);
    homeMulticaller.call(address, HOME_TOKEN, 'balanceOf', [address]);
  });

  const [lockResults, homeBalances] = await Promise.all([
    locksMulticaller.execute(),
    homeMulticaller.execute()
  ]);

  return Object.fromEntries(
    addresses.map((address) => {
      const locks = lockResults[address] ?? [];
      const sHome = locks.reduce((acc, lock) => acc + toJsNum(lock.amount), 0);
      const home = toJsNum(homeBalances[address] ?? 0);

      const weightedPower = sHome * 0.8 + home * 0.2;
      return [address, weightedPower];
    })
  );
}
