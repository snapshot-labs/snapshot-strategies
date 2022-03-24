import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'Meph1587';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
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

  const calls: any[] = [];
  const multipliers: any[] = [];
  options.tokens.map((token, idx) => {
    addresses.forEach((address: any) => {
      calls.push([token, 'balanceOf', [address]]);
      multipliers.push(options.weights[idx] || 1);
    });
  });

  const response = await multicall(network, provider, abi, calls, { blockTag });

  const merged = {};
  response.map((value: any, i: number) => {
    const address = calls[i][2][0];
    merged[address] = (merged[address] || 0) as number;
    merged[address] +=
      parseFloat(formatUnits(value.toString(), 0)) * multipliers[i];
  });

  return merged;
}
