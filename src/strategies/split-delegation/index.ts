import fetch from 'cross-fetch';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Strategy } from '@snapshot-labs/snapshot.js/dist/src/voting/types';
import { getAddress } from '@ethersproject/address';

export const author = 'gnosisguild';
export const version = '1.0.0';

const DEFAULT_BACKEND_URL = 'https://delegate-api.gnosisguild.org';

type Params = {
  backendUrl: string;
  strategies: Strategy[];
  totalSupply: string | number;
  delegationOverride?: boolean;
};

export async function strategy(
  space: string,
  network: string,
  _provider: StaticJsonRpcProvider,
  addresses: string[],
  options: Params = {
    backendUrl: DEFAULT_BACKEND_URL,
    strategies: [],
    totalSupply: 0,
    delegationOverride: false
  },
  snapshot: string | number
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  if (options.strategies.length > 8)
    throw new Error('Maximum 8 strategies allowed');

  const response = await fetch(
    `${options.backendUrl}/api/v1/${space}/${blockTag}/voting-power`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        strategy: {
          name: 'split-delegation',
          network: Number(network),
          params: {
            totalSupply: options.totalSupply,
            delegationOverride: options.delegationOverride,
            strategies: options.strategies
          }
        },
        addresses
      })
    }
  );

  const votingPowerByAddress = (await response.json()) as {
    [k: string]: number;
  };

  if (votingPowerByAddress.error) {
    throw new Error(
      `Error fetching voting power from backend: ${votingPowerByAddress.error}`
    );
  }

  return Object.keys(votingPowerByAddress).reduce((acc, address) => {
    acc[getAddress(address)] = votingPowerByAddress[address];
    return acc;
  }, {});
}
