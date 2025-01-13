import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { getAddress } from '@ethersproject/address';
import { Multicaller } from '../../utils';

export const author = 'defi-moses';
export const version = '0.1.0';

const tokenAbi = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

const stakingAbi = [
  'function lockedAmountOf(address account) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)' // Backup method
];

interface MulticallResult {
  [key: string]: {
    [address: string]: BigNumber;
  };
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  try {
    const multi = new Multicaller(network, provider, tokenAbi, { blockTag });

    // Convert addresses to checksum format
    const checksumAddresses = addresses.map(getAddress);

    checksumAddresses.forEach((address) => {
      multi.call(`token.${address}`, options.tokenAddress, 'balanceOf', [
        address
      ]);
    });

    const result = (await multi.execute()) as MulticallResult;

    const stakingMulti = new Multicaller(network, provider, stakingAbi, {
      blockTag
    });

    let stakingResult: MulticallResult = { staking: {} };
    try {
      checksumAddresses.forEach((address) => {
        stakingMulti.call(
          `staking.${address}`,
          options.stakingAddress,
          'lockedAmountOf',
          [address]
        );
      });
      stakingResult = await stakingMulti.execute();
    } catch (error) {
      const balanceMulti = new Multicaller(network, provider, stakingAbi, {
        blockTag
      });

      checksumAddresses.forEach((address) => {
        balanceMulti.call(
          `staking.${address}`,
          options.stakingAddress,
          'balanceOf',
          [address]
        );
      });

      try {
        stakingResult = await balanceMulti.execute();
      } catch (error) {
        stakingResult = { staking: {} };
      }
    }

    return Object.fromEntries(
      checksumAddresses.map((address) => {
        const tokenBalance = result.token?.[address] || BigNumber.from(0);
        const stakedBalance =
          stakingResult.staking?.[address] || BigNumber.from(0);

        const formattedTokenBalance = parseFloat(
          formatUnits(tokenBalance, options.decimals)
        );
        const formattedStakedBalance = parseFloat(
          formatUnits(stakedBalance, options.decimals)
        );

        return [address, formattedTokenBalance + formattedStakedBalance];
      })
    );
  } catch (error) {
    throw error;
  }
}
