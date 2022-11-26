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

/**
 * @notice This strategy returns the total amount of vested tokens for a given user
 * The particularity of this strategy is the ability to skip the cliff period for the voting power.
 * So if Alice has a vesting line starting on August 2022, with a cliff period of 6 months,
 * a vesting period of 3 years and a total amount of 1000 tokens, she is going to accumulate voting power from August 2022,
 * and in January 2023, she will have 1/6 of the total voting power, i.e. 1000/6 = 166.66 voting power.
 * As a consequence, any voter has its full voting power from the vesting contract 6 month before the end of the vesting period.
 *
 * @notice In order to handle claimed tokens, we are linearizing the amount accumulated and not claimed by the user from the beginning
 * of the vesting power distribution (start - cliff) to the current date, at the rate of the vesting duration.
 * So if Alice is claiming 166 tokens on August 2023 (6 months after the beginning of the distribution), whe are going to have
 * 1000 - 166 = 834 tokens left to linearize from (start - cliff) to August 2023. This is an approximation of the voting power from
 * the vesting amount.
 */
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
  // 2. total claimed
  // 3. beginning time (after cliff period: bgn = startVesting + cliff)
  // 4. end time (with cliff period: end = startVesting + cliff + duration = bgn + duration)

  const multiVestCaller = new Multicaller(
    options.vestingNetwork,
    provider,
    DSSVestAbi,
    { blockTag }
  );
  ids.forEach((id) => {
    multiVestCaller.call('tot' + id, options.DSSVestAddress, 'tot', [id]);
    multiVestCaller.call('accrued' + id, options.DSSVestAddress, 'accrued', [
      id
    ]);
    multiVestCaller.call('bgn' + id, options.DSSVestAddress, 'bgn', [id]);
    multiVestCaller.call('fin' + id, options.DSSVestAddress, 'fin', [id]);
  });

  const multiVestResult: Record<string, BigNumberish> =
    await multiVestCaller.execute();

  return Object.fromEntries(
    addresses.map((address) => {
      const initialVotingPower = [address, 0];
      // fetch vested users data
      const ids = Object.entries(vestedAddresses)
        .filter(([, _address]) => _address === address)
        .map(([id]) => id);

      if (!ids.length) return initialVotingPower;
      const votingPower = ids.reduce((vp, id) => {
        const totalVested = multiVestResult['tot' + id];
        const totalAccrued = multiVestResult['accrued' + id];

        const bgn = multiVestResult['bgn' + id];
        const fin = multiVestResult['fin' + id];
        if (!(id && totalAccrued && totalVested && bgn && fin)) return vp;
        return vp.add(
          vestedAmountPower(
            BigNumber.from(totalVested).sub(totalAccrued),
            // Here, we are slicing the start to start minus cliff duration, in order to skip the cliff for the voting power calculation
            BigNumber.from(bgn).sub(options.cliffDuration),
            BigNumber.from(fin).sub(bgn).add(options.cliffDuration),
            now
          )
        );
      }, BigNumber.from(0));
      return [address, parseFloat(formatUnits(votingPower, options.decimals))];
    })
  );
}
