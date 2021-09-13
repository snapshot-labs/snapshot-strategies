import fetch from 'cross-fetch';
import { getAddress } from '@ethersproject/address';

export const author = 'bonustrack';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const url = `https://coordinape.me/api/${options.circle}/token-gifts?latest_epoch=1&snapshot=${snapshot}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });
  const gifts = await res.json();
  const scores = {};
  gifts.forEach(gift => {
    const address = getAddress(gift.recipient_address);
    if (!scores[address]) scores[address] = 0;
    scores[address] += gift.tokens;
  });
  return Object.fromEntries(
    addresses.map(address => [
      address,
      scores[getAddress(address)] || 0
    ])
  );
}
