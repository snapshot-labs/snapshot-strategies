import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';
import { formatEther } from '@ethersproject/units';

export const author = 'ZombieDAODev';
export const version = '0.1.0';

const stakingAbi = [
  'function depositsOf(address account) public view returns (uint256[] memory)',
  'function calculateRewards(address account, uint256[] tokenIds) public view returns (uint256[] memory)'
];

const tokenAbi = [
  'function balanceOf(address owner) public view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const stakingPool = new Multicaller(network, provider, stakingAbi, {
    blockTag
  });

  const tokenPool = new Multicaller(network, provider, tokenAbi, {
    blockTag
  });

  addresses.forEach((address) => {
    stakingPool.call(address, options.staking, 'depositsOf', [address]);
    tokenPool.call(address, options.token, 'balanceOf', [address]);
  });
  const [stakingResponse, tokenResponse]: [
    Record<string, BigNumberish[]>,
    Record<string, BigNumberish>
  ] = await Promise.all([stakingPool.execute(), tokenPool.execute()]);

  addresses.forEach((address) => {
    const tokenIds = stakingResponse[address].map((tokenId) =>
      BigNumber.from(tokenId).toNumber()
    );
    stakingPool.call(address, options.staking, 'calculateRewards', [
      address,
      tokenIds
    ]);
  });

  const rewardsResponse: Record<string, BigNumberish[]> =
    await stakingPool.execute();

  return Object.fromEntries(
    addresses.map((address) => {
      const claimedCount = formatEther(BigNumber.from(tokenResponse[address]));
      const unclaimedCount = formatEther(
        rewardsResponse[address].reduce(
          (prev, count) => BigNumber.from(prev).add(BigNumber.from(count)),
          BigNumber.from('0')
        )
      );
      return [address, parseInt(claimedCount) + parseInt(unclaimedCount)];
    })
  );
}
