import { getAddress } from '@ethersproject/address';
import { multicall } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'snapshot-labs';
export const version = '0.1.0';

const abi = ['function delegates(address) view returns (address)'];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const delegates = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.address,
      'delegates',
      [address.toLowerCase()]
    ]),
    { blockTag }
  );

  const score = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );
  return Object.fromEntries(
    Object.entries(score).map((address: any, i) => [
      getAddress(address[0]),
      delegates[i].toString().toLowerCase() === options.delegate.toLowerCase()
        ? address[1]
        : 0
    ])
  );
}
