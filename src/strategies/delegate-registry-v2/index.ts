import fetch from 'cross-fetch';
import { StaticJsonRpcProvider } from '@ethersproject/providers';

export const author = 'gnosis-guild';
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

  return response.json();
}
