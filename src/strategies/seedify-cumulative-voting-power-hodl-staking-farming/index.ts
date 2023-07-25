import { BigNumber } from '@ethersproject/bignumber';

import { multicall } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import {
  createCallToReadUsersData,
  createCallsToReadUsersData,
  toDecimals,
  calculateBep20InLPForUser,
  sfundStakingAbi,
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
  if (options.sfundStakingAddresses.length > 10) {
    throw new Error('More than 10 staking addresses');
  }
  if (options.legacySfundStakingAddresses.length > 10) {
    throw new Error('More than 10 LEGACY staking addresses');
  }

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const isUsingLegacyFarming =
    options.farmingAddress_SFUND_BNB_legacy != undefined;

  const zeroBalance = [
    BigNumber.from('0'),
    BigNumber.from('0'),
    BigNumber.from('0'),
    BigNumber.from('0')
  ];

  // required to use: erc20BalanceOfStrategy
  options.address = options.sfundAddress;

  //////// return SFUND, in user's wallet ////////
  const score: any = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  //////// return LP deposited into farming contract ////////
  const farmingCalls = [
    // from SNFTS-SFUND pool
    ...createCallToReadUsersData(
      addresses,
      options.farmingAddress_SNFTS_SFUND,
      'userDeposits'
    ),
    // from SFUND-BNB pool
    ...createCallToReadUsersData(
      addresses,
      options.farmingAddress_SFUND_BNB,
      'userDeposits'
    )
  ];
  if (isUsingLegacyFarming) {
    farmingCalls.push(
      ...createCallToReadUsersData(
        addresses,
        options.legacyfarmingAddress_SFUND_BNB,
        'userDeposits'
      )
    );
  }
  const farming = await multicall(network, provider, farmingAbi, farmingCalls, {
    blockTag
  });
  const snftsSfundFarming = farming.slice(0, addresses.length);
  const sfundBnbCurrentFarming = farming.slice(
    addresses.length,
    1 + addresses.length * 2
  );
  const sfundBnbLegacyFarming = isUsingLegacyFarming
    ? farming.slice(1 + addresses.length * 2, farming.length)
    : sfundBnbCurrentFarming;

  const staking = await multicall(
    network,
    provider,
    sfundStakingAbi,
    [
      ...createCallsToReadUsersData(
        addresses,
        options.sfundStakingAddresses,
        'userDeposits'
      ),
      ...createCallsToReadUsersData(
        addresses,
        options.legacySfundStakingAddresses,
        'userDeposits'
      )
    ],
    { blockTag }
  );
  const sfundStaking = staking.slice(
    0,
    addresses.length * options.sfundStakingAddresses.length
  );
  const legacySfundStaking = staking.slice(
    addresses.length * options.sfundStakingAddresses.length,
    staking.length
  );

  const erc20Res = await multicall(
    network,
    provider,
    bep20Abi,
    [
      [options.lpAddress_SFUND_BNB, 'totalSupply'],
      [options.sfundAddress, 'balanceOf', [options.lpAddress_SFUND_BNB]],
      [options.lpAddress_SNFTS_SFUND, 'totalSupply'],
      [options.sfundAddress, 'balanceOf', [options.lpAddress_SNFTS_SFUND]]
    ],
    { blockTag }
  );

  const sfundBnbTotalSupply = toDecimals(erc20Res[0]);
  const sfundInSfundBnbPool = toDecimals(erc20Res[1]);
  const snftsSfundTotalSupply = toDecimals(erc20Res[2]);
  const sfundInSnftsSfundPool = toDecimals(erc20Res[3]);

  return Object.fromEntries(
    Object.entries(score).map((sfundBalance: any, userIndex) => [
      sfundBalance[0],
      sfundBalance[1] +
        ////// SFUND from SFUND-BNB farming contracts (current & legacy) //////
        calculateBep20InLPForUser(
          sfundBnbCurrentFarming[userIndex],
          sfundBnbTotalSupply,
          sfundInSfundBnbPool
        ) +
        calculateBep20InLPForUser(
          isUsingLegacyFarming ? sfundBnbLegacyFarming[userIndex] : zeroBalance,
          sfundBnbTotalSupply,
          sfundInSfundBnbPool
        ) +
        ////// SFUND from SNFTS-SFUND farming contract //////
        calculateBep20InLPForUser(
          snftsSfundFarming[userIndex],
          snftsSfundTotalSupply,
          sfundInSnftsSfundPool
        ) +
        //// SFUND from staking contracts (current & legacy) //////
        getStakingBalanceOf(
          sfundStaking,
          userIndex,
          options.sfundStakingAddresses.length,
          addresses.length
        ) +
        getStakingBalanceOf(
          legacySfundStaking,
          userIndex,
          options.legacySfundStakingAddresses.length,
          addresses.length
        )
    ])
  );
}
