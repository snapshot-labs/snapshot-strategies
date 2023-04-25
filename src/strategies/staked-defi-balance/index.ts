// src/strategies/staked-defi-balance/index.ts

import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import { multicall } from '../../utils';

export const author = 'taha-abbasi';
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
  const stakingPoolContractAddress = options.stakingPoolContractAddress;
  const abi = options.methodABI;

  const stakingCalls = addresses.map((address) => {
    return [
      stakingPoolContractAddress,
      'stakeOf',
      [options.tokenContractAddress, address]
    ];
  });

  const stakes = await multicall(network, provider, abi, stakingCalls, {
    blockTag
  });

  const stakesMapped = {};
  for (let i = 0; i < addresses.length; i++) {
    stakesMapped[getAddress(addresses[i])] = stakes[i][0];
  }

  const addressScores = Object.fromEntries(
    addresses.map((address) => {
      const normalizedAddress = getAddress(address);
      const stakedBalance = stakesMapped[normalizedAddress];
      const formattedStakedBalance = parseFloat(
        formatUnits(stakedBalance, options.decimals)
      );
      return [
        normalizedAddress,
        stakedBalance.gte(options.minStakedBalance) ? formattedStakedBalance : 0
      ];
    })
  );

  return addressScores;
}
