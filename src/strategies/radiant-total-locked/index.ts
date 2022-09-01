import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'plind-dm';
export const version = '0.0.1';

const abi = [
  'function lockedBalances(address user) view returns (uint256 total, uint256 unlockable, uint256 locked, tuple(uint256 amount, uint256 unlockTime)[] lockData)'
]

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
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const result = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.multiFeeDistributor,
      'lockedBalances',
      getArgs(options, address)
    ]),
    { blockTag }
  );
  
  return Object.fromEntries(
    result.map((value, index) => [
      addresses[index],
      parseFloat(formatUnits(value.locked, options.decimals))
    ])
  );
}
