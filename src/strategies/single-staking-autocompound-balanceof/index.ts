/* eslint-disable prettier/prettier */
import { formatUnits } from '@ethersproject/units';
import { multicall, Multicaller } from '../../utils';

export const author = 'Otis';
export const version = '0.1.0';


const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'userInfo',
    outputs: [
      {
        internalType: 'uint256',
        name: 'shares',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'lastDepositedTime',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'fuzzAtLastUserAction',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'lastUserActionTime',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getPricePerFullShare',
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
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });

    addresses.forEach((address) =>
      multi.call(address, options.stakingPoolAddress, 'userInfo', [address])
    );

  const [[[getPricePerFullShare]]] = await Promise.all([
    multicall(
      network,
      provider,
      abi,
      [[options.stakingPoolAddress, 'getPricePerFullShare', []]],
      { blockTag }
    )
  ]);

  const result: Record<string, any> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, userInfo]) => [
      address,
      parseFloat(formatUnits(userInfo.shares, options.decimals)) * parseFloat(formatUnits(getPricePerFullShare, options.decimals))
    ])
  );
}
