import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';

import { Multicaller } from '../../utils';

export const author = '0x-logic';
export const version = '0.0.1';

const abi: string[] = [
  'function balanceOf(address account) external view returns (uint256)',
  'function convertToAssets(uint256 shares) public view returns (uint256 assets)'
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

  // 0. Initialize our Multicaller
  const multi = new Multicaller(network, provider, abi, { blockTag });

  // 1. Get the ERC4626 token balance of each address
  addresses.forEach((address: string) =>
    multi.call(address, options.address, 'balanceOf', [address])
  );
  const tokenBalanceResults: Record<string, BigNumberish> =
    await multi.execute();

  // 2. Convert the ERC4626 token balances to asset balances
  Object.entries(tokenBalanceResults).forEach(([address, balance]) =>
    multi.call(address, options.address, 'convertToAssets', [balance])
  );
  const assetBalanceResults: Record<string, BigNumberish> =
    await multi.execute();

  return Object.fromEntries(
    Object.entries(assetBalanceResults).map(([address, assetBalance]) => [
      address,
      parseFloat(formatUnits(assetBalance, options.decimals))
    ])
  );
}
