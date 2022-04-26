import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'spicysquid168';
export const version = '0.0.1';

const abi = [
  'function balanceOfAt(address _user,uint256 _blockNumber) external view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag =
    typeof snapshot === 'number' ? snapshot : await provider.getBlockNumber();

  const multi = new Multicaller(network, provider, abi);
  let result: Record<string, BigNumberish> = {};

  const chunkSize = 200;
  for (let i = 0; i < addresses.length; i += chunkSize) {
    const chunk = addresses.slice(i, i + chunkSize);
    chunk.forEach((address) =>
      multi.call(address, options.address, 'balanceOfAt', [address, blockTag])
    );
    result = await multi.execute();
  }

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
