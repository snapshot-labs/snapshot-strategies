import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'foxthefarmer';
export const version = '0.0.1';

const vaultAbi = ['function wantLockedTotal(address) view returns (uint256)'];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const vaultBalancesCalls: any = multicall(
    network,
    provider,
    vaultAbi,
    addresses.map((address: any) => [
      options.vaultAddress,
      'wantLockedTotal',
      [address]
    ]),
    { blockTag }
  );

  const vaultBalances = await Promise.all([vaultBalancesCalls]);

  return Object.fromEntries(
    Object.entries(addresses).map((address: any, index) => [
      address[1],
      parseFloat(formatUnits(vaultBalances[0][index].toString(), 18))
    ])
  );
}
