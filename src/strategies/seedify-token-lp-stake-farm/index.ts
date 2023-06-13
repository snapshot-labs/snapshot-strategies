import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'theo6890';
export const version = '0.1.0';

const sfundStakingAbi = [
  'function userDeposits(address) external view returns (uint256, uint256, uint256, uint256, uint256, bool)'
];

const stakingAddress_270days = '0x89aaaB217272C89dA91825D9Effbe65dEd384859';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // returns user's SFUND balance of their address
  let score: any = erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  // returns user's SFUND balance in Staking contract (IDOLocking)
  let userStakedBalance_270days: any = multicall(
    network,
    provider,
    sfundStakingAbi,
    addresses.map((address: any) => [
      stakingAddress_270days,
      'userDeposits',
      [address]
    ]),
    { blockTag }
  );

  const result = await Promise.all([score, userStakedBalance_270days]);

  score = result[0];
  userStakedBalance_270days = result[1];

  const getStakedBalance = (userStakedBalance: any) => {
    return parseFloat(formatUnits(userStakedBalance['0'].toString(), 18));
  };

  // console.log('score: ' + score);
  // console.log("userStakedBalance_270days: " + userStakedBalance_270days);

  return Object.fromEntries(
    Object.entries(score).map((sfundBalance: any, index) => [
      sfundBalance[0],
      sfundBalance[1] + getStakedBalance(userStakedBalance_270days[index])
    ])
  );
}
