import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'waOx6e';
export const version = '0.O.1';

const abi = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [
      {
        name: 'account',
        type: 'core::starknet::contract_address::ContractAddress'
      }
    ],
    outputs: [
      {
        type: 'core::integer::u256'
      }
    ],
    state_mutability: 'view'
  }
];

export async function strategy(
  space: string,
  network: string,
  provider,
  addresses: string[],
  options: { address: string; decimals: number; symbol?: string },
  snapshot: 'latest' | number
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((voterAddress) =>
    multi.call(voterAddress, options.address, 'balanceOf', [voterAddress])
  );
  const result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
