import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'andrew-frank';
export const version = '0.1.2';

const AVT_ABI = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // users AVTs
  const avtResponses: Array<[BigNumber]> = await multicall(
    network,
    provider,
    AVT_ABI,
    addresses.map((address: any) => [
      options.tokenAddress,
      'balanceOf',
      [address]
    ]),
    { blockTag }
  );
  const scores = avtResponses.map((value) => value[0]);

  return Object.fromEntries(
    scores.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), options.decimals))
    ])
  );
}
