import { formatEther } from '@ethersproject/units';
import { multicall } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'DEFI-Foundation';
export const version = '0.1.1';

const tokenAbi = [
  'function balanceOf(address account) external view returns (uint256)'
];

const abiStakingPool = [
  'function getSmartPoolVotes (address account, uint256 blockNumber) public view returns (uint256 votes)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag =
    typeof snapshot === 'number'
      ? snapshot
      : await provider.getBlockNumber(snapshot);

  const { stakingPoolMiddlewareAddress, tokenAddress } = options;

  const tokenResponse: BigNumber[] = await multicall(
    network,
    provider,
    tokenAbi,
    addresses.map((address: any) => {
      return [tokenAddress, 'balanceOf', [address.toLowerCase()]];
    }),
    { blockTag }
  );

  const tokenBalances = Object.fromEntries(
    Object.entries(tokenResponse).map(([address, balance]) => [
      address,
      formatEther(balance.toString())
    ])
  );

  const poolVotes = await multicall(
    network,
    provider,
    abiStakingPool,
    addresses.map((address: any) => {
      return [
        stakingPoolMiddlewareAddress,
        'getSmartPoolVotes',
        [address.toLowerCase(), blockTag]
      ];
    }),
    { blockTag }
  );

  return Object.fromEntries(
    poolVotes.map((value, index) => {
      const formattedVote = +(formatEther(value.votes.toString()) ?? 0);
      const formattedBalance = +(tokenBalances[index] ?? 0);
      const sum = formattedBalance + formattedVote;

      return [addresses[index], sum];
    })
  );
}
