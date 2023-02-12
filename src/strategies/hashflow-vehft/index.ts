import { getAddress } from '@ethersproject/address';
import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'gxmxni-hashflow';
export const version = '0.1.0';

const STAKES_ABI =
  'function stakes(address user) external returns (uint128 amount, uint64 lockExpiry)';
const BALANCE_OF_ABI =
  'function balanceOf(address owner) external view returns (uint256 balance)';

const FOUR_YEARS_IN_SECONDS = 4 * 365 * 24 * 3_600;

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const { timestamp } = await provider.getBlock(blockTag);

  const stakes = await multicall(
    network,
    provider,
    [STAKES_ABI],
    addresses.map((a) => [options.hftVault, 'stakes', [a]]),
    {
      blockTag
    }
  );

  const rawVotingPower = stakes.map((s) => {
    const timestampBN = BigNumber.from(timestamp);
    const timeUntilExpiry = (s[1].gt(timestampBN) ? s[1] : timestampBN).sub(
      timestampBN
    );
    return timeUntilExpiry.mul(s[0]).div(FOUR_YEARS_IN_SECONDS);
  });

  const nftBalances = await multicall(
    network,
    provider,
    [BALANCE_OF_ABI],
    addresses.map((a) => [options.nftContract, 'balanceOf', [a]]),
    {
      blockTag
    }
  );

  const votingPower = rawVotingPower.map((rvp, idx) =>
    parseFloat(
      formatUnits(rvp.mul(nftBalances[idx][0].gt(0) ? 110 : 100).div(100), 18)
    )
  );

  return Object.fromEntries(
    addresses.map((a, idx) => [getAddress(a), votingPower[idx]])
  );
}
