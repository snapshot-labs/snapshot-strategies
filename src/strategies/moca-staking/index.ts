import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'mocaverse';
export const version = '0.1.0';

const abi = [
  'function getUser(address user) view returns (tuple(uint256 amount, uint256 cumulativeWeight, uint256 lastUpdateTimestamp))'
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
