import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'cesarsld';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)'
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
  options.registries.forEach((registry) => {
    addresses.forEach((address: any) => {
      calls.push([registry, 'balanceOf', [address]]);
    });
  });

  const response = await multicall(network, provider, abi, calls, { blockTag });
  const nanaCall = [
    ['0xe2311ae37502105b442bbef831e9b53c5d2e9b3b', 'totalSupply', []]
  ];
  const nanaSupply = await multicall(network, provider, abi, nanaCall, {
    blockTag
  });

  const merged = {};
  response.map((value: any, i: number) => {
    const address = calls[i][2][0];
    merged[address] = (merged[address] || 0) as number;
    if (Math.floor(i / addresses.length) == 0)
      merged[address] += parseFloat(formatUnits((3 * value).toString(), 0));
    else if (Math.floor(i / addresses.length) == 1)
      merged[address] += parseFloat(formatUnits(value.toString(), 0));
    else if (Math.floor(i / addresses.length) == 2)
      merged[address] += parseFloat(
        formatUnits(Math.floor((15000 * value) / nanaSupply).toString(), 0)
      );
  });

  return merged;
}
