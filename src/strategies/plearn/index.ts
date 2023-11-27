import { Provider } from '@ethersproject/providers';
import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'plearnclub';
export const version = '0.0.1';

const lockedPoolabi = [
  'function userInfo(address) view returns (uint256 amount)'
];

const foundingInvestorPoolabi = [
  'function userInfo(address) view returns (uint256 initialAmount, uint256 amount)'
];

const pendingWithdrawalabi = [
  'function lockedBalances(address user) view returns (uint256 total, uint256 unlockable, uint256 locked, tuple(uint256 amount, uint256 unlockTime)[] lockData)'
];

function calculateScore(
  resultsDict: { [address: string]: any[] },
  poolAddresses: { address: string; decimals: number }[],
  balanceKey: string,
  decimals: number[]
): { [address: string]: number } {
  return Object.keys(resultsDict).reduce((acc, address) => {
    acc[address] = poolAddresses.reduce((poolAcc, pool, poolIndex) => {
      const result = resultsDict[address][poolIndex];
      if (result && result[balanceKey]) {
        return (
          poolAcc +
          parseFloat(
            formatUnits(result[balanceKey].toString(), decimals[poolIndex])
          )
        );
      } else {
        return poolAcc;
      }
    }, 0);
    return acc;
  }, {});
}

function transformResults(
  res: any[],
  addresses: string[]
): { [address: string]: any[] } {
  return res.reduce((acc, result, index) => {
    const address = addresses[index % addresses.length];
    if (!acc[address]) {
      acc[address] = [];
    }
    acc[address].push(result);
    return acc;
  }, {});
}

export async function strategy(
  space: string,
  network: string,
  provider: Provider,
  addresses: string[],
  options: {
    lockedPoolAddresses: { address: string; decimals: number }[];
    foundingInvestorPoolAddresses: { address: string; decimals: number }[];
    pendingWithdrawalAddresses: { address: string; decimals: number }[];
    symbol: string;
    address: string;
    decimals: number;
  },
  snapshot: number | string
): Promise<{ [address: string]: number }> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const score = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  const lockedPoolCalls = options.lockedPoolAddresses.flatMap((item) =>
    addresses.map((address) => [
      item.address,
      'userInfo',
      [address],
      { blockTag }
    ])
  );

  const foundingInvestorPoolCalls =
    options.foundingInvestorPoolAddresses.flatMap((item) =>
      addresses.map((address) => [
        item.address,
        'userInfo',
        [address],
        { blockTag }
      ])
    );

  const pendingWithdrawalCalls = options.pendingWithdrawalAddresses.flatMap(
    (item) =>
      addresses.map((address) => [
        item.address,
        'lockedBalances',
        [address],
        { blockTag }
      ])
  );

  const [
    lockedPoolBalancesRes,
    foundingInvestorPoolBalancesRes,
    pendingWithdrawalBalancesRes
  ] = await Promise.all([
    multicall(network, provider, lockedPoolabi, lockedPoolCalls, { blockTag }),
    multicall(
      network,
      provider,
      foundingInvestorPoolabi,
      foundingInvestorPoolCalls,
      { blockTag }
    ),
    multicall(network, provider, pendingWithdrawalabi, pendingWithdrawalCalls, {
      blockTag
    })
  ]);

  const lockedPoolResults = transformResults(lockedPoolBalancesRes, addresses);
  const foundingInvestorPoolResults = transformResults(
    foundingInvestorPoolBalancesRes,
    addresses
  );
  const pendingWithdrawalResults = transformResults(
    pendingWithdrawalBalancesRes,
    addresses
  );

  const lockedPoolScore = calculateScore(
    lockedPoolResults,
    options.lockedPoolAddresses,
    'amount',
    options.lockedPoolAddresses.map((item) => item.decimals)
  );
  const foundingInvestorPoolScore = calculateScore(
    foundingInvestorPoolResults,
    options.foundingInvestorPoolAddresses,
    'amount',
    options.foundingInvestorPoolAddresses.map((item) => item.decimals)
  );
  const pendingWithdrawalScore = calculateScore(
    pendingWithdrawalResults,
    options.pendingWithdrawalAddresses,
    'total',
    options.pendingWithdrawalAddresses.map((item) => item.decimals)
  );

  const finalScore = Object.keys(score).reduce((acc, address) => {
    acc[address] =
      score[address] +
      (lockedPoolScore[address] || 0) +
      (foundingInvestorPoolScore[address] || 0) +
      (pendingWithdrawalScore[address] || 0);
    return acc;
  }, {});

  return finalScore;
}
