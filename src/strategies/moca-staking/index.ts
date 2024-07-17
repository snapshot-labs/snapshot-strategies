import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'm1ngshum';
export const version = '0.1.0';

const abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address'
      }
    ],
    name: 'getUser',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'cumulativeWeight',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'lastUpdateTimestamp',
            type: 'uint256'
          }
        ],
        internalType: 'struct SimpleStaking.Data',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

function getArgs(options, address: string) {
  const args: Array<string | number> = options.args || ['%{address}'];
  return args.map((arg) =>
    typeof arg === 'string' ? arg.replace(/%{address}/g, address) : arg
  );
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.address,
      'getUser',
      getArgs(options, address)
    ]),
    { blockTag }
  );

  return Object.fromEntries(
    response.map(([value], i) => [
      addresses[i],
      parseFloat(formatUnits(value.amount, options.decimals))
    ])
  );
}
