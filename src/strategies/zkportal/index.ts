import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import fetch from 'cross-fetch';

export const author = 'vicsn';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {

  const url = `https://snapshot.zkportal.io/verify_eth_addresses`;
  const blockTag = typeof snapshot === 'number' ? snapshot.toString() : 'latest';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      addresses: addresses,
      blocktag: blockTag
    })
  });
  const result: Record<string, BigNumberish> = await response.json();

  return Object.fromEntries(
    Object.entries(result.records).map(([address, score]) => [
      address,
      parseFloat(formatUnits(score, 0))
    ])
  );
}
