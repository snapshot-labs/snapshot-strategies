import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { Multicaller } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'theo6890';
export const version = '0.1.0';

const sfundStakingAbi = [
  'function userDeposits(address) external view returns (uint256, uint256, uint256, uint256, uint256, bool)'
];
const sfundFarmingAbi = [
  'function userDeposits(address from) external view returns (uint256, uint256, uint256, uint256)'
];
const bep20Abi = [
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)'
];

const getBalanceOf = (userStakedBalance: any) => {
  return toDecimals(userStakedBalance['0']);
};

const toDecimals = (bigNumber: any) => {
  return parseFloat(formatUnits(bigNumber.toString(), 18));
};

const calculateBep20InLPForUser = (
  lpStaked: any,
  totalLPSupply: any,
  totalBep20InPool: any
) => {
  lpStaked = toDecimals(lpStaked['0']);

  return (lpStaked / totalLPSupply) * totalBep20InPool;
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // required to use: erc20BalanceOfStrategy
  options.address = options.sfundAddress;

  // returns user's SFUND balance of their address
  let score: any = erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  // return LP from SFUND-BNB pool, deposited into farming contract by user
  let userLPStaked_SFUND_BNB: any = multicall(
    network,
    provider,
    sfundFarmingAbi,
    addresses.map((address: any) => [
      options.farmingAddress_SFUND_BNB,
      'userDeposits',
      [address]
    ]),
    { blockTag }
  );
  // same but for legacy farming contract
  let userLPStaked_SFUND_BNB_legacyFarming: any = multicall(
    network,
    provider,
    sfundFarmingAbi,
    addresses.map((address: any) => [
      options.legacyfarmingAddress_SFUND_BNB,
      'userDeposits',
      [address]
    ]),
    { blockTag }
  );

  // returns user's SFUND balance in Staking contract (IDOLocking)
  let userStakedBalance_270days: any = multicall(
    network,
    provider,
    sfundStakingAbi,
    addresses.map((address: any) => [
      options.sfundStakingAddress_270days,
      'userDeposits',
      [address]
    ]),
    { blockTag }
  );

  const result = await Promise.all([
    score,
    userLPStaked_SFUND_BNB,
    userLPStaked_SFUND_BNB_legacyFarming,
    userStakedBalance_270days
  ]);

  score = result[0];
  userLPStaked_SFUND_BNB = result[1];
  userLPStaked_SFUND_BNB_legacyFarming = result[2];
  userStakedBalance_270days = result[3];

  const erc20Multi = new Multicaller(network, provider, bep20Abi, {
    blockTag
  });

  erc20Multi.call(
    'sfundBnbTotalSupply',
    options.lpAddress_SFUND_BNB,
    'totalSupply'
  );
  erc20Multi.call('sfundInSfundBnbPool', options.sfundAddress, 'balanceOf', [
    options.lpAddress_SFUND_BNB
  ]);

  const erc20Result = await erc20Multi.execute();

  const sfundBnbTotalSupply = toDecimals(erc20Result.sfundBnbTotalSupply);
  const sfundInSfundBnbPool = toDecimals(erc20Result.sfundInSfundBnbPool);

  // console.log('score: ' + score);
  // console.log("userStakedBalance_270days: " + userStakedBalance_270days);

  return Object.fromEntries(
    Object.entries(score).map((sfundBalance: any, index) => [
      sfundBalance[0],
      sfundBalance[1] +
        // SFUND from farming contracts (current & legacy)
        calculateBep20InLPForUser(
          userLPStaked_SFUND_BNB[index],
          sfundBnbTotalSupply,
          sfundInSfundBnbPool
        ) +
        calculateBep20InLPForUser(
          userLPStaked_SFUND_BNB_legacyFarming[index],
          sfundBnbTotalSupply,
          sfundInSfundBnbPool
        ) +
        // SFUND from staking contracts (current & legacy)
        getBalanceOf(userStakedBalance_270days[index])
    ])
  );
}
