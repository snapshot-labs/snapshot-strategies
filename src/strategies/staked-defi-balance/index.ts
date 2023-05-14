// src/strategies/staked-defi-balance/index.ts

import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import { multicall, getProvider } from '../../utils';
import openStakingAbi from './ABI/openStakingABI.json';
import standardStakingAbi from './ABI/standardStakingABI.json';
import { ABI } from './types';

export const author = 'taha-abbasi';
export const version = '1.3.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const maxContractsPerStrategy = 5;
  if (options.contracts.length > maxContractsPerStrategy) {
    throw new Error(
      'Maximum of 5 contracts allowed per strategy, see details: https://github.com/snapshot-labs/snapshot-strategies#code'
    );
  }
  const addressScores = {};

  for (const params of options.contracts) {
    const paramNetwork = network.toString();
    const paramSnapshot = typeof snapshot === 'number' ? snapshot : 'latest';

    const stakingPoolContractAddress = params.stakingPoolContractAddress;
    let abi: ABI;
    switch (params.stakingType) {
      case 'open':
        abi = openStakingAbi[0] as ABI;
        break;
      case 'standard':
        abi = standardStakingAbi[0] as ABI;
        break;
      default:
        throw new Error(`Invalid stakingType: ${params.stakingType}`);
    }

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

      if (!addressScores[normalizedAddress]) {
        addressScores[normalizedAddress] = 0;
      }

      addressScores[normalizedAddress] += formattedStakedBalance;
    });
  }

  const minStakedBalance = parseFloat(options.minStakedBalance);

  Object.keys(addressScores).forEach((address) => {
    if (addressScores[address] < minStakedBalance) {
      delete addressScores[address];
    }
  });

  return addressScores;
}
