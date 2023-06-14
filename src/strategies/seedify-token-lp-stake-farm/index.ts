import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { Multicaller } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'theo6890';
export const version = '0.1.0';

const sfundStakingAbi = [
  'function userDeposits(address) external view returns (uint256, uint256, uint256, uint256, uint256, bool)'
];
const farmingAbi = [
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

  //////// return SFUND, in user's wallet ////////
  let score: any = erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  //////// return LP from SFUND-BNB pool, deposited into farming contract ////////
  // current farming
  let userLPStaked_SFUND_BNB: any = multicall(
    network,
    provider,
    farmingAbi,
    addresses.map((address: any) => [
      options.farmingAddress_SFUND_BNB,
      'userDeposits',
      [address]
    ]),
    { blockTag }
  );
  // legacy farming
  let userLPStaked_SFUND_BNB_legacyFarming: any = multicall(
    network,
    provider,
    farmingAbi,
    addresses.map((address: any) => [
      options.legacyfarmingAddress_SFUND_BNB,
      'userDeposits',
      [address]
    ]),
    { blockTag }
  );

  //////// return LP from SNFTS-SFUND pool, deposited into farming contract ////////
  let userLPStaked_SNFTS_SFUND: any = multicall(
    network,
    provider,
    farmingAbi,
    addresses.map((address: any) => [
      options.farmingAddress_SNFTS_SFUND,
      'userDeposits',
      [address]
    ]),
    { blockTag }
  );

  //////// return user's SFUND balance in staking contract (IDOLocking) ////////
  //// current ////
  // 30 days
  let userStakedBalance_30days: any = multicall(
    network,
    provider,
    sfundStakingAbi,
    addresses.map((address: any) => [
      options.sfundStakingAddress_30days,
      'userDeposits',
      [address]
    ]),
    { blockTag }
  );
  // 90 days
  let userStakedBalance_90days: any = multicall(
    network,
    provider,
    sfundStakingAbi,
    addresses.map((address: any) => [
      options.sfundStakingAddress_90days,
      'userDeposits',
      [address]
    ]),
    { blockTag }
  );
  // 180 days
  let userStakedBalance_180days: any = multicall(
    network,
    provider,
    sfundStakingAbi,
    addresses.map((address: any) => [
      options.sfundStakingAddress_180days,
      'userDeposits',
      [address]
    ]),
    { blockTag }
  );
  // 270 days
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
  //// legacy ////
  // 7 days
  let legacy_userStakedBalance_7days: any = multicall(
    network,
    provider,
    sfundStakingAbi,
    addresses.map((address: any) => [
      options.legacysfundStakingAddress_7days,
      'userDeposits',
      [address]
    ]),
    { blockTag }
  );
  // 14 days
  let legacy_userStakedBalance_14days: any = multicall(
    network,
    provider,
    sfundStakingAbi,
    addresses.map((address: any) => [
      options.legacysfundStakingAddress_14days,
      'userDeposits',
      [address]
    ]),
    { blockTag }
  );
  // 30 days
  let legacy_userStakedBalance_30days: any = multicall(
    network,
    provider,
    sfundStakingAbi,
    addresses.map((address: any) => [
      options.legacysfundStakingAddress_30days,
      'userDeposits',
      [address]
    ]),
    { blockTag }
  );
  // 60 days
  let legacy_userStakedBalance_60days: any = multicall(
    network,
    provider,
    sfundStakingAbi,
    addresses.map((address: any) => [
      options.legacysfundStakingAddress_60days,
      'userDeposits',
      [address]
    ]),
    { blockTag }
  );
  // 90 days
  let legacy_userStakedBalance_90days: any = multicall(
    network,
    provider,
    sfundStakingAbi,
    addresses.map((address: any) => [
      options.legacysfundStakingAddress_90days,
      'userDeposits',
      [address]
    ]),
    { blockTag }
  );
  // 180 days
  let legacy_userStakedBalance_180days: any = multicall(
    network,
    provider,
    sfundStakingAbi,
    addresses.map((address: any) => [
      options.legacysfundStakingAddress_180days,
      'userDeposits',
      [address]
    ]),
    { blockTag }
  );

  const result = await Promise.all([
    score,
    userLPStaked_SFUND_BNB,
    userLPStaked_SFUND_BNB_legacyFarming,
    userLPStaked_SNFTS_SFUND,
    userStakedBalance_30days,
    userStakedBalance_90days,
    userStakedBalance_180days,
    userStakedBalance_270days,
    legacy_userStakedBalance_7days,
    legacy_userStakedBalance_14days,
    legacy_userStakedBalance_30days,
    legacy_userStakedBalance_60days,
    legacy_userStakedBalance_90days,
    legacy_userStakedBalance_180days
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
  erc20Multi.call(
    'snftsSfundTotalSupply',
    options.lpAddress_SNFTS_SFUND,
    'totalSupply'
  );
  erc20Multi.call('snftsInSnftsSfundPool', options.snftsAddress, 'balanceOf', [
    options.lpAddress_SNFTS_SFUND
  ]);

  const erc20Result = await erc20Multi.execute();

  const sfundBnbTotalSupply = toDecimals(erc20Result.sfundBnbTotalSupply);
  const sfundInSfundBnbPool = toDecimals(erc20Result.sfundInSfundBnbPool);
  const snftsSfundTotalSupply = toDecimals(erc20Result.snftsSfundTotalSupply);
  const snftsInSnftsSfundPool = toDecimals(erc20Result.snftsInSnftsSfundPool);

  // console.log('score: ' + score);
  // console.log("userStakedBalance_270days: " + userStakedBalance_270days);

  return Object.fromEntries(
    Object.entries(score).map((sfundBalance: any, index) => [
      sfundBalance[0],
      sfundBalance[1] +
        ////// SFUND from farming contracts (current & legacy) //////
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
        ////// SNFTS from farming contract //////
        calculateBep20InLPForUser(
          userLPStaked_SNFTS_SFUND[index],
          snftsSfundTotalSupply,
          snftsInSnftsSfundPool
        ) +
        ////// SFUND from staking contracts (current & legacy) //////
        // current
        getBalanceOf(userStakedBalance_30days[index]) +
        getBalanceOf(userStakedBalance_90days[index]) +
        getBalanceOf(userStakedBalance_180days[index]) +
        getBalanceOf(userStakedBalance_270days[index]) +
        // legacy
        getBalanceOf(legacy_userStakedBalance_7days[index]) +
        getBalanceOf(legacy_userStakedBalance_14days[index]) +
        getBalanceOf(legacy_userStakedBalance_30days[index]) +
        getBalanceOf(legacy_userStakedBalance_60days[index]) +
        getBalanceOf(legacy_userStakedBalance_90days[index]) +
        getBalanceOf(legacy_userStakedBalance_180days[index])
    ])
  );
}
