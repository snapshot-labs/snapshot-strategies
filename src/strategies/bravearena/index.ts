import fetch from 'cross-fetch';
const { getAddress } = require('@ethersproject/address');

export const author = 'bravearena';
export const version = '0.1.0';

const API_URLS = {
  42161: 'https://api.bravearena.io/staking/power',
  421613: 'https://dev.bravearena.io/staking/power',
  5: 'https://dev.bravearena.io/staking/power'
};

type VPListRequest = {
  addresses: string[];
  blockTime: number;
  network: number
};

async function getVPList({
  addresses,
  network,
  blockTime
}: VPListRequest): Promise<number[]> {
  const res = await fetch(API_URLS[network], {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      addressList: addresses,
      blockTime
    })
  });
  const data = (await res.json()) as any;
  return data;
}


export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const block = await provider.getBlock('latest');
  const blockTime = block.timestamp;
  const { chainId } = options;
  const vpList = await getVPList({
    addresses,
    blockTime,
    network: chainId?? network
  });
  const result = {};
  for (let index = 0; index < addresses.length; index ++) {
    result[getAddress(addresses[index])] = vpList[index];
  }
  return result;
}
