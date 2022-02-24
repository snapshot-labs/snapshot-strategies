import { BigNumber, BigNumberish } from '@ethersproject/bignumber';

import { StaticJsonRpcProvider } from '@ethersproject/providers';
import fetch from 'cross-fetch';
import { formatUnits } from '@ethersproject/units';
import { strategy as getL1Balances } from '../erc20-balance-of';

export const author = 'immutable';
export const version = '1.0.0';

export const name = 'immutable-x';

const snapshotPath = '/v1/snapshots/balances';

const networkMapping = {
  1: 'https://api.x.immutable.com',
  3: 'https://api.ropsten.x.immutable.com'
};

const defaultPageSize = 1000;

interface Response {
  records: Score[];
  cursor: string;
}

interface Score {
  ether_key: string;
  balance: string;
}

interface Options {
  address: string;
  decimals: number;
  pageSize?: number;
}

export async function strategy(
  _space: unknown,
  network: string,
  provider: StaticJsonRpcProvider,
  addresses: string[],
  options: Options,
  block: number | string = 'latest'
): Promise<Record<string, number>> {
  return combineBalanceScores([
    await getL2Balances(network, options, addresses, block),
    await getL1Balances(null, network, provider, addresses, options, block)
  ]);
}

async function getL2Balances(
  network: string,
  options: Options,
  addresses: string[],
  block: number | string
): Promise<Record<string, number>> {
  const records: Record<string, number> = {};

  // Sanitize pageSize
  options.pageSize ??= defaultPageSize;

  // Loop variables
  let cursor = '',
    receivedLen = 0;

  // Until all records are returned
  while (receivedLen < addresses.length) {
    // Build URL
    const apiUrl = buildURL(network, options, block, cursor);
    // Send request
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: JSON.stringify({
        ether_keys: addresses.slice(receivedLen, receivedLen+options.pageSize)
      }),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    });
    // Decode response
    const resJson = await response.json();
    // Store result
    Object.assign(records, mapL2Response(resJson, options));
    // Iterate
    cursor = resJson.cursor;
    receivedLen += (resJson as Response).records.length;
  }
  return records;
}

function buildURL(
  network: string,
  options: Options,
  block: number | string,
  cursor?: string
): string {
  let apiUrl = networkMapping[network] + snapshotPath;
  apiUrl += '/' + options.address.toLowerCase();
  apiUrl += `?page_size=${options.pageSize}`;
  apiUrl += typeof block === 'number' ? `&block=${block}` : '';
  apiUrl += cursor || cursor != '' ? `&cursor=${cursor}` : '';
  return apiUrl;
}

function mapL2Response(
  data: Response,
  options: Options
): Record<string, number> {
  return Object.fromEntries(
    data.records.map((value: Score) => [
      value.ether_key,
      formatBalance(value.balance, options.decimals)
    ])
  );
}

function formatBalance(
  balance: BigNumber | string,
  decimals: BigNumberish
): number {
  return parseFloat(formatUnits(balance, decimals));
}

function combineBalanceScores(
  records: Record<string, number>[]
): Record<string, number> {
  return records.reduce((aggScore, currScore) => {
    for (const [address, balance] of Object.entries(currScore)) {
      if (!aggScore[address]) {
        aggScore[address] = balance;
      } else {
        aggScore[address] += balance; // sum(L1, L2)
      }
    }
    return aggScore;
  }, {});
}
