import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'etedwardelric';
export const version = '0.0.1';

const abi = [
  'function balanceOf(address _owner) view returns (uint256 balance)',
  'function userInfo(uint256, address) view returns (uint256 amount, uint256 rewardDebt)',
  'function stakedWantTokens(uint256 _pid, address _user) view returns (uint256)',
  'function totalSupply() view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });

  if (options.miningMasters)
    options.miningMasters = options.miningMasters.slice(0, 20);
  if (options.upMiningMasters)
    options.upMiningMasters = options.upMiningMasters.slice(0, 20);
  if (options.lps) {
    options.lps = options.lps.slice(0, 5);
    options.lps.forEach((lp) => {
      if (lp.miningMasters) lp.miningMasters = lp.miningMasters.slice(0, 20);
      if (lp.upMiningMasters)
        lp.upMiningMasters = lp.upMiningMasters.slice(0, 20);
    });
  }

  addresses.forEach((address) => {
    multi.call(`${address}-${options.token}`, options.token, 'balanceOf', [
      address
    ]);
    if (options.miningMasters)
      options.miningMasters.forEach((miningMaster) =>
        multi.call(
          `${address}-${miningMaster.address}-${miningMaster.pid}`,
          miningMaster.address,
          'userInfo',
          [miningMaster.pid, address]
        )
      );
    if (options.upMiningMasters)
      options.upMiningMasters.forEach((upMiningMaster) =>
        multi.call(
          `${address}-${upMiningMaster.address}-${upMiningMaster.pid}`,
          upMiningMaster.address,
          'stakedWantTokens',
          [upMiningMaster.pid, address]
        )
      );
  });

  addresses.forEach((address) =>
    options.lps.forEach((lp) => {
      multi.call(`${lp.lpToken}-${options.token}`, options.token, 'balanceOf', [
        lp.lpToken
      ]);
      multi.call(`${lp.lpToken}`, lp.lpToken, 'totalSupply');
      multi.call(`${address}-${lp.lpToken}`, lp.lpToken, 'balanceOf', [
        address
      ]);
      if (lp.miningMasters)
        lp.miningMasters.forEach((miningMaster) =>
          multi.call(
            `${address}-${lp.lpToken}-${miningMaster.address}-${miningMaster.pid}`,
            miningMaster.address,
            'userInfo',
            [miningMaster.pid, address]
          )
        );
      if (lp.upMiningMasters)
        lp.upMiningMasters.forEach((upMiningMaster) =>
          multi.call(
            `${address}-${lp.lpToken}-${upMiningMaster.address}-${upMiningMaster.pid}`,
            upMiningMaster.address,
            'stakedWantTokens',
            [upMiningMaster.pid, address]
          )
        );
    })
  );

  const result = await multi.execute();

  return Object.fromEntries(
    addresses.map((address) => {
      let amount = BigNumber.from(0);
      amount = amount.add(result[`${address}-${options.token}`]);
      if (options.miningMasters)
        for (const miningMaster of options.miningMasters) {
          amount = amount.add(
            result[`${address}-${miningMaster.address}-${miningMaster.pid}`][0]
          );
        }
      if (options.upMiningMasters)
        for (const upMiningMaster of options.upMiningMasters) {
          amount = amount.add(
            result[`${address}-${upMiningMaster.address}-${upMiningMaster.pid}`]
          );
        }
      for (const lp of options.lps) {
        amount = amount.add(
          result[`${address}-${lp.lpToken}`]
            .mul(result[`${lp.lpToken}-${options.token}`])
            .mul(lp.multi ?? 1000)
            .div(result[`${lp.lpToken}`])
            .div(1000)
        );
        if (lp.miningMasters)
          for (const miningMaster of lp.miningMasters) {
            amount = amount.add(
              result[
                `${address}-${lp.lpToken}-${miningMaster.address}-${miningMaster.pid}`
              ][0]
                .mul(result[`${lp.lpToken}-${options.token}`])
                .mul(lp.multi ?? 1000)
                .div(result[`${lp.lpToken}`])
                .div(1000)
            );
          }
        if (lp.upMiningMasters)
          for (const upMiningMaster of lp.upMiningMasters) {
            amount = amount.add(
              result[
                `${address}-${lp.lpToken}-${upMiningMaster.address}-${upMiningMaster.pid}`
              ]
                .mul(result[`${lp.lpToken}-${options.token}`])
                .mul(lp.multi ?? 1000)
                .div(result[`${lp.lpToken}`])
                .div(1000)
            );
          }
      }
      return [address, parseFloat(formatUnits(amount))];
    })
  );
}
