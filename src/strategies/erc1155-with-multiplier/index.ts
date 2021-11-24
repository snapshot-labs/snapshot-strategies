import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'fabianschu';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address owner, uint256 id) view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const multiplier = options.multiplier || 1;
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.address,
      'balanceOf',
      [address, options.tokenId]
    ]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), options.decimals)) * multiplier
    ])
  );
}
