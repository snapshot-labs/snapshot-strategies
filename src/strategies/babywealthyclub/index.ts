import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'gp6284';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
];
const BWC_ADDRESS = '0xb7F7c7D91Ede27b019e265F8ba04c63333991e02';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const erc20Balance = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );
  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [BWC_ADDRESS, 'balanceOf', [address]]),
    { blockTag }
  );

  return Object.fromEntries(
    addresses.map((address, i) => [
      address,
      parseFloat(formatUnits(response[i].toString(), 0)) > 0
        ? Math.floor(
            erc20Balance[addresses[i]] / (options.weighted || 10000000000)
          )
        : 0
    ])
  );
}
