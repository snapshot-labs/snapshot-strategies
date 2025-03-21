import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';
import { formatUnits } from '@ethersproject/units';

export const author = 'npbroo';
export const version = '0.1.0';

const ERC20_ABI = [
  'function balanceOf(address account) external view returns (uint256)'
];

const STAKING_ABI = [
  'function getStakedTokens(address _owner) external view returns (uint16[] memory)',
  'function currentRewardsOf(uint16 _tokenId) public view returns (uint256)'
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

  const stakingPool = new Multicaller(network, provider, STAKING_ABI, {
    blockTag
  });

  const tokenPool = new Multicaller(network, provider, ERC20_ABI, {
    blockTag
  });

  addresses.forEach((address) => {
    stakingPool.call(address, options.staking, 'getStakedTokens', [address]);
    tokenPool.call(address, options.token, 'balanceOf', [address]);
  });

  const [stakingResponse, tokenResponse]: [
    Record<string, number[]>,
    Record<string, BigNumberish>
  ] = await Promise.all([stakingPool.execute(), tokenPool.execute()]);

  addresses.forEach((address) => {
    stakingResponse[address].forEach((id) => {
      stakingPool.call(id, options.staking, 'currentRewardsOf', [id]);
    });
  });

  const stakedRewardsResponse: Record<string, BigNumberish[]> =
    await stakingPool.execute();

  return Object.fromEntries(
    addresses.map((address) => {
      const claimedCount = parseInt(
        formatUnits(BigNumber.from(tokenResponse[address]), options.decimals)
      );
      let total_staked_reward = 0;
      stakingResponse[address].forEach((id) => {
        total_staked_reward += parseInt(
          formatUnits(
            BigNumber.from(stakedRewardsResponse[id]),
            options.decimals
          )
        );
      });
      return [address, claimedCount + total_staked_reward];
    })
  );
}
