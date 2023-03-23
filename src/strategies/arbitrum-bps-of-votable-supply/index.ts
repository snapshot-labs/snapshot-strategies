import { BigNumber } from '@ethersproject/bignumber';
import { multicall } from '../../utils';

export const author = 'gzeoneth';
export const version = '0.1.0';

const abi = [
  'function getVotes(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)'
];

const EXCLUDE_ADDRESS = '0x00000000000000000000000000000000000A4B86';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const [[totalSupply], [excludedSupply]] = await multicall(
    network,
    provider,
    abi,
    [
      [options.address, 'totalSupply', []],
      [options.address, 'getVotes', [EXCLUDE_ADDRESS.toLowerCase()]]
    ],
    { blockTag }
  );
  const votableSupply = totalSupply.sub(excludedSupply);
  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.address,
      'getVotes',
      [address.toLowerCase()]
    ]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(
        BigNumber.from(value.toString()).mul(10000).div(votableSupply).toString()
      )
    ])
  );
}
