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

function transformResults(
  res: any[],
  addresses: string[],
  balanceTransformer: (result: any) => number
): { [address: string]: number } {
  return res.reduce((acc: { [address: string]: number }, result, index) => {
    const address = addresses[index % addresses.length];
    if (!acc[address]) {
      acc[address] = 0;
    }

    const amount = balanceTransformer(result);
    acc[address] += amount;
    return acc;
  }, {});
}

export async function strategy(
  space: string,
  network: string,
  provider: Provider,
  addresses: string[],
  options: {
    lockedPoolAddresses: { address: string }[];
    foundingInvestorPoolAddresses: { address: string }[];
    pendingWithdrawalAddresses: { address: string }[];
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

  const lockedPoolScore = transformResults(
    lockedPoolBalancesRes,
    addresses,
    (result) => {
      if (result.amount === null || result.amount === undefined) {
        return 0;
      }
      return parseFloat(
        formatUnits(result.amount.toString(), options.decimals)
      );
    }
  );
  const foundingInvestorPoolScore = transformResults(
    foundingInvestorPoolBalancesRes,
    addresses,
    (result) => {
      if (result.amount === null || result.amount === undefined) {
        return 0;
      }
      return parseFloat(
        formatUnits(result.amount.toString(), options.decimals)
      );
    }
  );
  const pendingWithdrawalScore = transformResults(
    pendingWithdrawalBalancesRes,
    addresses,
    (result) => {
      if (result.total === null || result.total === undefined) {
        return 0;
      }
      return parseFloat(formatUnits(result.total.toString(), options.decimals));
    }
  );

  const finalScore = Object.keys(score).reduce(
    (acc: { [address: string]: number }, address) => {
      acc[address] = Math.trunc(
        score[address] +
          (lockedPoolScore[address] || 0) +
          (foundingInvestorPoolScore[address] || 0) +
          (pendingWithdrawalScore[address] || 0)
      );
      return acc;
    },
    {}
  );

  return finalScore;
}
