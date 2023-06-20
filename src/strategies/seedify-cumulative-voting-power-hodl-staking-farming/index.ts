import { Multicaller } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import {
  createPromise,
  createStakingPromises,
  toDecimals,
  calculateBep20InLPForUser,
  getStakingBalanceOf
} from './utils';
import { farmingAbi, bep20Abi } from './utils';

export const author = 'theo6890';
export const version = '0.1.0';

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
  let userLPStaked_SFUND_BNB: any = createPromise(
    farmingAbi,
    options.farmingAddress_SFUND_BNB,
    'userDeposits'
  );
  // legacy farming
  let userLPStaked_SFUND_BNB_legacyFarming: any = createPromise(
    farmingAbi,
    options.legacyfarmingAddress_SFUND_BNB,
    'userDeposits'
  );

  //////// return LP from SNFTS-SFUND pool, deposited into farming contract ////////
  let userLPStaked_SNFTS_SFUND: any = createPromise(
    farmingAbi,
    options.farmingAddress_SNFTS_SFUND,
    'userDeposits'
  );

  //////// return user's SFUND balance in staking contract (IDOLocking) ////////
  let sfundStaking: any = createStakingPromises(options.sfundStakingAddresses);
  let legacySfundStaking: any = createStakingPromises(
    options.legacySfundStakingAddresses
  );

  const result = await Promise.all([
    score,
    userLPStaked_SFUND_BNB,
    userLPStaked_SFUND_BNB_legacyFarming,
    userLPStaked_SNFTS_SFUND,
    ...sfundStaking,
    ...legacySfundStaking
  ]);

  score = result[0];
  userLPStaked_SFUND_BNB = result[1];
  userLPStaked_SFUND_BNB_legacyFarming = result[2];
  userLPStaked_SNFTS_SFUND = result[3];
  sfundStaking = result.slice(4, 4 + options.sfundStakingAddresses.length);
  legacySfundStaking = result.slice(
    8,
    8 + options.legacySfundStakingAddresses.length
  );

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
  erc20Multi.call('sfundInSnftsSfundPool', options.sfundAddress, 'balanceOf', [
    options.lpAddress_SNFTS_SFUND
  ]);

  const erc20Result = await erc20Multi.execute();

  const sfundBnbTotalSupply = toDecimals(erc20Result.sfundBnbTotalSupply);
  const sfundInSfundBnbPool = toDecimals(erc20Result.sfundInSfundBnbPool);
  const snftsSfundTotalSupply = toDecimals(erc20Result.snftsSfundTotalSupply);
  const sfundInSnftsSfundPool = toDecimals(erc20Result.sfundInSnftsSfundPool);

  return Object.fromEntries(
    Object.entries(score).map((sfundBalance: any, userIndex) => [
      sfundBalance[0],
      sfundBalance[1] +
        ////// SFUND from SFUND-BNB farming contracts (current & legacy) //////
        calculateBep20InLPForUser(
          userLPStaked_SFUND_BNB[userIndex],
          sfundBnbTotalSupply,
          sfundInSfundBnbPool
        ) +
        calculateBep20InLPForUser(
          userLPStaked_SFUND_BNB_legacyFarming[userIndex],
          sfundBnbTotalSupply,
          sfundInSfundBnbPool
        ) +
        ////// SFUND from SFNTS-SFUND farming contract //////
        calculateBep20InLPForUser(
          userLPStaked_SNFTS_SFUND[userIndex],
          snftsSfundTotalSupply,
          sfundInSnftsSfundPool
        ) +
        ////// SFUND from staking contracts (current & legacy) //////
        getStakingBalanceOf(sfundStaking, userIndex) +
        getStakingBalanceOf(legacySfundStaking, userIndex)
    ])
  );
}
