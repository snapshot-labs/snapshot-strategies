import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'hedgey-finance';
export const version = '1.0.0';

const abi = [
  'function delegatedBalances(address delegate, address token) view returns (uint256 delegatedBalance)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });
  options.contracts.forEach((contract) => {
    addresses.forEach((address) =>
      multi.call(address, contract, 'delegatedBalances', [
        address,
        options.token
      ])
    );
  });

  const result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals)) * options.multiplier
    ])
  );
}
