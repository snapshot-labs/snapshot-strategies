import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { getAddress } from '@ethersproject/address';
import { Multicaller } from '../../utils';

export const author = 'defi-moses';
export const version = '0.2.0';

const SUPPORTED_CHAINS = {
  '1': {
    tokenAddress: '0x0f2D719407FdBeFF09D87557AbB7232601FD9F29',
    stakingAddress: '0x00000010cd90b3688d249d84c616de3a0343e60f'
  },
  '42161': {
    // Arbitrum
    tokenAddress: '0x080f6aed32fc474dd5717105dba5ea57268f46eb',
    stakingAddress: '0x00000010cd90b3688d249d84c616de3a0343e60f'
  },
  '43114': {
    // Avalanche
    tokenAddress: '0x1f1E7c893855525b303f99bDF5c3c05Be09ca251',
    stakingAddress: '0x00000010cd90b3688d249d84c616de3a0343e60f'
  },
  '10': {
    // Optimism
    tokenAddress: '0x5A5fFf6F753d7C11A56A52FE47a177a87e431655',
    stakingAddress: '0x00000010cd90b3688d249d84c616de3a0343e60f'
  },
  '56': {
    // BSC
    tokenAddress: '0xa4080f1778e69467e905b8d6f72f6e441f9e9484',
    stakingAddress: '0x00000010cd90b3688d249d84c616de3a0343e60f'
  },
  '137': {
    // Polygon
    tokenAddress: '0xf8f9efc0db77d8881500bb06ff5d6abc3070e695',
    stakingAddress: '0x00000010cd90b3688d249d84c616de3a0343e60f'
  },
  '8453': {
    // Base
    tokenAddress: '0x432036208d2717394d2614d6697c46DF3Ed69540',
    stakingAddress: '0x00000010cd90b3688d249d84c616de3a0343e60f'
  }
};

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

async function getChainBalance(
  network: string,
  provider,
  addresses: string[],
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const chainConfig = SUPPORTED_CHAINS[network];
  if (!chainConfig) {
    throw new Error(`Network ${network} not supported`);
  }

  try {
    const multi = new Multicaller(network, provider, tokenAbi, { blockTag });
    const checksumAddresses = addresses.map(getAddress);

    checksumAddresses.forEach((address) => {
      multi.call(`token.${address}`, chainConfig.tokenAddress, 'balanceOf', [
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
          chainConfig.stakingAddress,
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
          chainConfig.stakingAddress,
          'balanceOf',
          [address]
        );
      });

      try {
        stakingResult = await balanceMulti.execute();
      } catch (error) {
        console.warn(`Failed to fetch staking balances for network ${network}`);
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
    throw new Error(`Error fetching balances for network ${network}: ${error}`);
  }
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  // Check if the selected network is supported
  if (!SUPPORTED_CHAINS[network]) {
    throw new Error(`Network ${network} not supported`);
  }

  const result = await getChainBalance(
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  return result;
}
