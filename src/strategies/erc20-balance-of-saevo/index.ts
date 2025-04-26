import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import fetch from 'cross-fetch';

export const author = 'timongll';
export const version = '0.1.0';

interface EpochStakeAmount {
  stakedAmount: string;
  unstakedAmount: string;
  unstakedBlock: number;
  epoch: number;
}

interface StakedAccount {
  id: string;
  totalStakedAmount: string;
  epochStakeAmounts: EpochStakeAmount[];
}

const SUBGRAPH_URI =
  'https://api.goldsky.com/api/public/project_clch40o0v0d510huoey7g5yaz/subgraphs/aevo-staking/1.0.3/gn';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const accountsToQuery = addresses
    .map((addr) => `"${addr.toLowerCase()}"`)
    .join(',');

  const query = `
    {
      stakedAccounts(where: {id_in: [${accountsToQuery}]}) {
        id,
        totalStakedAmount,
        epochStakeAmounts {
          stakedAmount,
          unstakedAmount,
          unstakedBlock,
          epoch
        }
      }
    }
  `;

  const response = await fetch(SUBGRAPH_URI, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  const data = await response.json();
  const stakedAccounts = data.data.stakedAccounts as StakedAccount[];

  const result: Record<string, number> = {};

  // Initialize all addresses with 0 balance using checksum format
  addresses.forEach((address) => {
    result[getAddress(address)] = 0;
  });

  // Process each staked account
  stakedAccounts.forEach((account) => {
    let totalStaked = BigInt(0);

    // Sum up all valid staked amounts
    account.epochStakeAmounts.forEach((epochStake) => {
      // Only count if the unstake block is greater than blockNumber
      // or if unstake block is undefined (which means the user has not unstaked yet)
      if (!epochStake.unstakedBlock || epochStake.unstakedBlock > snapshot) {
        totalStaked += BigInt(epochStake.stakedAmount);
      }
    });

    // Convert to number with proper decimals and store with checksum address
    result[getAddress(account.id)] = parseFloat(
      formatUnits(totalStaked.toString(), options.decimals)
    );
  });

  return result;
}
