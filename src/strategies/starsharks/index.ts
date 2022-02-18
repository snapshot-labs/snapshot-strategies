import fetch from 'cross-fetch';
import { formatUnits } from '@ethersproject/units';
const { getAddress } = require('@ethersproject/address');

export const author = 'starsharks';
export const version = '0.1.0';

const API_URLS = {
  56: 'https://pre-www.starsharks.com/go/api/stake/vote-weight',
  97: 'https://develop.sharkshake.net/go/api/stake/vote-weight'
};

type DepositListRequest = {
  addresses: string[];
  block_id: number;
  network: number;
};

type Deposit = {
  vesss_amount: string;
  begin_at: number;
  end_at: number;
};

type DepositListResponse = Record<string, Deposit[]>;

async function getAddressesDespoits({
  addresses,
  block_id,
  network
}: DepositListRequest): Promise<DepositListResponse> {
  const res = await fetch(API_URLS[network], {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accounts: addresses,
      block_id
    })
  });
  const data = (await res.json()) as any;
  return data.data;
}

function calcPowerByDeposits(deposits: Deposit[]) {
  const now = Date.now();
  let power = 0;
  for (const deposit of deposits) {
    const { vesss_amount, begin_at, end_at } = deposit;
    if (begin_at * 1000 < now && end_at * 1000 > now) {
      const remainTimePercent =
        (now - begin_at * 1000) / ((end_at - begin_at) * 1000);
      const increment = Number(formatUnits(vesss_amount)) * remainTimePercent;
      power += increment;
    }
  }
  return power;
}

export async function strategy(
  _space,
  network,
  _provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const block_id = typeof snapshot === 'number' ? snapshot : 0;
  const { chainId } = options;
  const depositsMap = await getAddressesDespoits({
    addresses,
    block_id,
    network: chainId ?? network
  });

  const result = {};
  for (const address in depositsMap) {
    const deposits = depositsMap[address];
    result[getAddress(address)] = calcPowerByDeposits(deposits);
  }

  return result;
}
