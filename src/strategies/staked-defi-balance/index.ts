// src/strategies/staked-defi-balance/index.ts

import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import { multicall, getProvider } from '../../utils';

export const author = 'taha-abbasi';
export const version = '1.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const addressScores = {};

  for (const params of options) {
    const paramNetwork = params.network.toString();
    const paramSnapshot =
      typeof params.snapshot === 'number' ? params.snapshot : 'latest';

    const stakingPoolContractAddress = params.stakingPoolContractAddress;
    const abi = params.methodABI[0];

    const stakingCalls = addresses.map((address) => {
      const inputs = abi.inputs.map((input) => {
        if (input.name === 'id') {
          return params.tokenContractAddress;
        } else if (input.name === 'staker' || input.name === 'account') {
          return address;
        }
      });
      return [stakingPoolContractAddress, abi.name, inputs];
    });
    
    try {
      const stakes = await multicall(
        paramNetwork,
        getProvider(paramNetwork),
        [abi],
        stakingCalls,
        { blockTag: paramSnapshot }
      );

      const stakesMapped = {};
      for (let i = 0; i < addresses.length; i++) {
        stakesMapped[getAddress(addresses[i])] = stakes[i][0];
      }

      addresses.forEach((address) => {
        const normalizedAddress = getAddress(address);
        const stakedBalance = stakesMapped[normalizedAddress];
        const formattedStakedBalance = parseFloat(
          formatUnits(stakedBalance, params.decimals)
        );

        // Initialize address score if it doesn't exist
        if (!addressScores[normalizedAddress]) {
          addressScores[normalizedAddress] = 0;
        }

        addressScores[normalizedAddress] += formattedStakedBalance;
      });
    } catch (error) {
      console.error('Error in multicall:', error);
    }
  }

  // Filter out addresses that have a total staked balance less than the minStakedBalance
  const minStakedBalance = parseFloat(
    formatUnits(options[0].minStakedBalance, options[0].decimals)
  );
  Object.keys(addressScores).forEach((address) => {
    if (addressScores[address] < minStakedBalance) {
      delete addressScores[address];
    }
  });

  return addressScores;
}
