import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'arugulo';
export const version = '0.1.0';

// Merged ABI for sUMAMI and Marinate contracts
const abi = [
  'function balanceOf(address account) view returns (uint256)',
  'function stakedBalance(address account, uint32 level) view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  if (options.marinateLevels.length > 4) {
    return [];
  }
  const sUmamiBalances = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  const marinateBalances = await Promise.all(
    options.marinateLevels.map((level: number) =>
      multicall(
        network,
        provider,
        abi,
        addresses.map((address: any) => [
          options.marinateAddress,
          'stakedBalance',
          [address, level],
          { blockTag }
        ]),
        { blockTag }
      )
    )
  );

  const totalMarinateBalances = marinateBalances.reduce(
    //@ts-ignore
    (prev: any, cur: any) =>
      cur.map(
        (balance, idx) =>
          (prev[idx] || 0) +
          parseFloat(formatUnits(balance.toString(), options.decimals))
      ),
    []
  );

  return Object.fromEntries(
    Object.entries(sUmamiBalances).map((address, index) => [
      address[0],
      //@ts-ignore
      address[1] + totalMarinateBalances[index]
    ])
  );
}
