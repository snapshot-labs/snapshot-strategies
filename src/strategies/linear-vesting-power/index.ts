import { call, Multicaller } from '../../utils';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';

export const author = 'morpho-labs';
export const version = '0.1.0';

const DSSVestAbi = [
  'function usr(uint256 _id) external view returns (address)',
  'function tot(uint256 _id) external view returns (uint256)',
  'function accrued(uint256 _id) external view returns (uint256)',
  'function bgn(uint256 _id) external view returns (uint256)',
  'function fin(uint256 _id) external view returns (uint256)',
  'function ids() external view returns (uint256)'
];

const vestedAmountPower = (
  totalVestedNotClaimed: BigNumberish,
  startDate: BigNumberish,
  period: BigNumberish,
  now: BigNumberish
) => {
  now = BigNumber.from(now);
  const amount = BigNumber.from(totalVestedNotClaimed);
  if (now.lte(startDate)) return BigNumber.from(0);
  if (now.gt(BigNumber.from(startDate).add(period)))
    return totalVestedNotClaimed;
  return now.sub(startDate).mul(amount).div(period);
};

const idsArray = (maxId: number) =>
  Array.from({ length: maxId }, (_, i) => i + 1);

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const block = await provider.getBlock(blockTag);
  const now = block.timestamp;
  // fetch the number of vesting accounts
  const maxId: BigNumber = await call(
    provider,
    DSSVestAbi,
    [options.DSSVestAddress, 'ids', []],
    {
      blockTag
    }
  );

  // create an array of each vesting ID: [1:maxId]
  const ids = idsArray(maxId.toNumber());

  // And then, we fetch the vesting data for each vesting ID
  // 1. vester address
  const multiVest = new Multicaller(
    options.vestingNetwork,
    provider,
    DSSVestAbi,
    {
      blockTag
    }
  );

  ids.forEach((id) => multiVest.call(id, options.DSSVestAddress, 'usr', [id]));
  const vestedAddresses: Record<string, string> = await multiVest.execute();

  // 1. total vested
  const multiVestTotCaller = new Multicaller(
    options.vestingNetwork,
    provider,
    DSSVestAbi,
    { blockTag }
  );
  ids.forEach((id) =>
    multiVestTotCaller.call(id, options.DSSVestAddress, 'tot', [id])
  );
  const multiVestTot: Record<string, BigNumberish> =
    await multiVestTotCaller.execute();

  // 2. total claimed
  const multiVestAccruedCaller = new Multicaller(
    options.vestingNetwork,
    provider,
    DSSVestAbi,
    { blockTag }
  );
  ids.forEach((id) =>
    multiVestAccruedCaller.call(id, options.DSSVestAddress, 'accrued', [id])
  );
  const multiVestAccrued: Record<string, BigNumberish> =
    await multiVestAccruedCaller.execute();

  // 3. beginning time (after cliff period: bgn = startVesting + cliff)
  const multiVestBgnCaller = new Multicaller(
    options.vestingNetwork,
    provider,
    DSSVestAbi,
    { blockTag }
  );
  ids.forEach((id) =>
    multiVestBgnCaller.call(id, options.DSSVestAddress, 'bgn', [id])
  );
  const multiVestBgn: Record<string, BigNumberish> =
    await multiVestBgnCaller.execute();

  // 4. end time (with cliff period: end = startVesting + cliff + duration = bgn + duration)
  const multiVestFinCaller = new Multicaller(
    options.vestingNetwork,
    provider,
    DSSVestAbi,
    { blockTag }
  );
  ids.forEach((id) =>
    multiVestFinCaller.call(id, options.DSSVestAddress, 'fin', [id])
  );
  const multiVestFin: Record<string, BigNumberish> =
    await multiVestFinCaller.execute();

  return Object.fromEntries(
    addresses.map((address) => {
      const initialVotingPower = [address, 0];
      // fetch vested users data
      const [id] =
        Object.entries(vestedAddresses).find(
          ([, _address]) => _address === address
        ) ?? [];
      if (id === undefined) return initialVotingPower;
      const totalVested = multiVestTot[id];
      const totalAccrued = multiVestAccrued[id];
      const bgn = multiVestBgn[id];
      const fin = multiVestFin[id];
      if (!(id && totalAccrued && totalVested && bgn && fin))
        return initialVotingPower;
      const votingPower = vestedAmountPower(
        BigNumber.from(totalVested).sub(totalAccrued),
        BigNumber.from(bgn).sub(options.cliffDuration),
        BigNumber.from(fin).sub(bgn).add(options.cliffDuration),
        now
      );
      return [address, parseFloat(formatUnits(votingPower, options.decimals))];
    })
  );
}
