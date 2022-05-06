import { formatUnits } from '@ethersproject/units';
import { call, multicall } from '../../utils';

export const author = '0xAurelius';
export const version = '0.0.1';

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const rawERC20Balance = await call(
    provider,
    abi,
    [options.erc20Address, 'balanceOf', [options.address]],
    { blockTag }
  );
  const erc20Balance = parseFloat(formatUnits(
    rawERC20Balance, options.erc20Decimals
  ));

  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [options.address, 'balanceOf', [address]]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), 0)) * erc20Balance
    ])
  );
}
