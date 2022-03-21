import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'pancake-swap';
export const version = '0.0.1';

const sousChefabi = [
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
        name: 'amount',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

export async function strategy(
  space,
  network,
  provider,
  addresses: string[],
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const sousBalances = await Promise.all(
    options.chefAddresses.map((item) =>
      multicall(
        network,
        provider,
        sousChefabi,
        addresses.map((address: any) => [
          item.address,
          'userInfo',
          [address],
          { blockTag }
        ]),
        { blockTag }
      )
    )
  );

  return addresses.reduce((acc, address, index) => {
    return {
      ...acc,
      [address]: sousBalances.reduce(
        (prev: number, cur: any, idx: number) =>
          prev +
          parseFloat(
            formatUnits(
              cur[index].amount.toString(),
              options.chefAddresses[idx].decimals
            )
          ),
        0
      )
    };
  }, {});
}
