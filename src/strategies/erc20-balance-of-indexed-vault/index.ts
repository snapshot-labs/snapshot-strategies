import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { call, Multicaller } from '../../utils';

export const author = '0xAurelius';
export const version = '0.0.1';

const indexABI = ['function index() public view returns (uint256)'];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const rawIndex = await call(
    provider,
    indexABI,
    [options.indexAddress, 'index', []],
    { blockTag }
  );
  const index = parseFloat(formatUnits(rawIndex, options.indexDecimals));

  const multi = new Multicaller(network, provider, [options.vaultBalanceABI], { blockTag });
  addresses.forEach((address) =>
    multi.call(
      address, options.vaultAddress, options.vaultBalanceABI.name,
      [address].concat(options.vaultBalanceExtraArgs)
    )
  );
  const balances: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(balances).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals)) * index
    ])
  );
}
