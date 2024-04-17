import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'arpitkarnatak';
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
  options.registries.slice(0, 2).forEach((registry) => {
    addresses.forEach((address: any) => {
      calls.push([registry, 'balanceOf', [address]]);
    });
  });

  const response = await multicall(network, provider, abi, calls, { blockTag });

  const merged = {};
  response.map((value: any, i: number) => {
    const address = calls[i][2][0];
    const registry = calls[i][0];
    merged[registry] = merged[registry] || {};
    merged[registry][address] = merged[registry][address] ?? 0;
    merged[registry][address] += parseFloat(formatUnits(value.toString(), 0));
  });

  const powers = {};
  addresses.forEach((address: any) => {
    const balance0 = merged[options.registries[0]][address] ?? 0;
    const balance1 = merged[options.registries[1]][address] ?? 0;
    const pairCount = Math.min(balance0, balance1);
    const votePower =
      pairCount * options.pairWeight +
      (balance0 - pairCount) * options.weights[0] +
      (balance1 - pairCount) * options.weights[1];
    powers[address] = votePower;
  });
  return powers;
}
