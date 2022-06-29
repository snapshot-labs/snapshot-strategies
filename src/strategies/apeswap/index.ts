import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import examplesFile from './examples.json';
import fetch from 'cross-fetch';

export const author = 'ApeSwapFinance';
export const version = '0.0.1';
export const examples = examplesFile;

const POOL_URL =
  'https://raw.githubusercontent.com/ApeSwapFinance/apeswap-yields/main/config/pools.json';
const abi = [
  'function balanceOf(address _owner) view returns (uint256 balance)',
  'function userInfo(address) view returns (uint256 amount, uint256 rewardDebt)'
];

const bn = (num: any): BigNumber => {
  return BigNumber.from(num.toString());
};

const addUserBalance = (userBalances, user: string, balance) => {
  if (userBalances[user]) {
    return (userBalances[user] = userBalances[user].add(balance));
  } else {
    return (userBalances[user] = balance);
  }
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const response = await fetch(POOL_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });

  const pools = await response.json();

  const blockSnapshot =
    typeof snapshot === 'number' ? snapshot : options.snapshot;
  const poolsGnana = pools.filter(
    (pool) =>
      pool.stakingToken.address[56].toLowerCase() ===
        options.address.toLowerCase() && pool.bonusEndBlock > blockSnapshot
  );

  const multicall = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address: any) => {
    multicall.call(`token.${address}`, options.address, 'balanceOf', [address]);
    poolsGnana.forEach((pool: any) => {
      multicall.call(
        `pool_${pool.contractAddress[56]}.${address}`,
        pool.contractAddress[56],
        'userInfo',
        [address]
      );
    });
  });
  const result = await multicall.execute();

  const userBalances: any = [];
  for (let i = 0; i < addresses.length - 1; i++) {
    userBalances[addresses[i]] = bn(0);
  }

  addresses.forEach((address: any) => {
    addUserBalance(userBalances, address, result.token[address] ?? 0);
    poolsGnana.forEach((pool: any) => {
      addUserBalance(
        userBalances,
        address,
        result[`pool_${pool.contractAddress[56]}`][address][0]
      );
    });
  });

  return Object.fromEntries(
    Object.entries(userBalances).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(<BigNumberish>balance, options.decimals))
    ])
  );
}
