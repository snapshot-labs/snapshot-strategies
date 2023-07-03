import fetch from 'cross-fetch';
import { StaticJsonRpcProvider } from '@ethersproject/providers';

export const author = 'gnosis';
export const version = '0.0.1';

const DEFAULT_BACKEND_URL = 'https://delegate-registry-backend.vercel.app';

type Params = {
  backendUrl: string;
};

export async function strategy(
  space: string,
  network: string,
  provider: StaticJsonRpcProvider,
  addresses: string[],
  options: Params = { backendUrl: DEFAULT_BACKEND_URL },
  snapshot: string | number
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  console.log('space', space);

  // 1. get delegated votes (must return 0 for the addresses that has delegated)
  const response = await fetch(
    `${options.backendUrl}/api/${space}/snapshot/${blockTag}/strategy-formatted-vote-weights`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(addresses)
    }
  );

  // 2. get the not delegated raw votes

  return response.json();
}
