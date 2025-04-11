import { getAddress } from '@ethersproject/address';
import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'gxmxni-hashflow';
export const version = '0.1.0';

const BALANCE_OF_ABI =
  'function balanceOf(address owner) external view returns (uint256 balance)';
const STAKE_POWER_ABI =
  'function getStakePower(address user) external returns (uint256 power)';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const stakePower = await multicall(
    network,
    provider,
    [STAKE_POWER_ABI],
    addresses.map((a) => [options.hftVault, 'getStakePower', [a]]),
    {
      blockTag
    }
  );
  const rawVotingPower = stakePower.map((s) => s[0]);

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
