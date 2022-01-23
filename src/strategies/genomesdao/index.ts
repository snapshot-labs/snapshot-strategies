import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.1';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function token0() external view returns (address)',
  'function getReserves() external view returns (uint112, uint112, uint32)'
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

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, options.address, 'balanceOf', [address])
  );
  const result: Record<string, BigNumberish> = await multi.execute();

  addresses.forEach((address) =>
    multi.call(address, options.lpaddress, 'balanceOf', [address])
  );
  const resultLP: Record<string, BigNumberish> = await multi.execute();

  multi.call('token0', options.lpaddress, 'token0', []);
  multi.call('getReserves', options.lpaddress, 'getReserves', []);
  multi.call('totalSupply', options.lpaddress, 'totalSupply', []);
  const { token0, getReserves, totalSupply } = await multi.execute();
  let totalGnomeAmount: BigNumberish;
  if (token0.toLowerCase() === options.address.toLowerCase()) {
    totalGnomeAmount = getReserves[0];
  } else {
    totalGnomeAmount = getReserves[1];
  }
  return Object.fromEntries(
    Object.entries(resultLP).map(([address, balance]) => {
      let bal: BigNumber = BigNumber.from(balance)
        .mul(totalGnomeAmount)
        .div(totalSupply);
      bal = bal.add(result[address]);
      return [address, parseFloat(formatUnits(bal, options.decimals))];
    })
  );
}
