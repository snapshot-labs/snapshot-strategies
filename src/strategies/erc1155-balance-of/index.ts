import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'dave4506';
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
  if (!options.tokenId) {
    throw new Error(
      'options.tokenId is required for erc-1155-balance-of strategy'
    );
  }

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
      parseFloat(formatUnits(value.toString(), options.decimals))
    ])
  );
}
