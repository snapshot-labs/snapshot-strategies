import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
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
    // Initialize multicaller for token balances
    const multi = new Multicaller(network, provider, tokenAbi, { blockTag });

    // Get token balances
    addresses.forEach((address) => {
      multi.call(`token.${address}`, options.tokenAddress, 'balanceOf', [
        address
      ]);
    });

    const result = (await multi.execute()) as MulticallResult;
    console.log('Token balances result:', result);

    // Initialize multicaller for staking balances
    const stakingMulti = new Multicaller(network, provider, stakingAbi, {
      blockTag
    });

    // First try lockedAmountOf
    let stakingResult: MulticallResult = { staking: {} };
    try {
      addresses.forEach((address) => {
        stakingMulti.call(
          `staking.${address}`,
          options.stakingAddress,
          'lockedAmountOf',
          [address]
        );
      });
      stakingResult = await stakingMulti.execute();
    } catch (error) {
      // Reset multicaller and try balanceOf
      const balanceMulti = new Multicaller(network, provider, stakingAbi, {
        blockTag
      });

      addresses.forEach((address) => {
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

    const scores = Object.fromEntries(
      addresses.map((address) => {
        // Get token balance and convert from BigNumber
        const tokenBalance = result.token?.[address] || BigNumber.from(0);
        const stakedBalance =
          stakingResult.staking?.[address] || BigNumber.from(0);

        // Format the balances using the correct decimals
        const formattedTokenBalance = parseFloat(
          formatUnits(tokenBalance, options.decimals)
        );
        const formattedStakedBalance = parseFloat(
          formatUnits(stakedBalance, options.decimals)
        );

        const total = formattedTokenBalance + formattedStakedBalance;

        return [address, total];
      })
    );

    return scores;
  } catch (error) {
    throw error;
  }
}
