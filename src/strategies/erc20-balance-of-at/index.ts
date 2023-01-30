import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'OfficialDevTeamSix';
export const version = '0.1.0';

const abi = [
  'function balanceOfAt(address account, uint256 snapshotId) external view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options
): Promise<Record<string, number>> {
  const multi = new Multicaller(network, provider, abi);
  addresses.forEach((address) =>
    multi.call(address, options.address, 'balanceOfAt', [
      address,
      options.snapshotId
    ])
  );
  const result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
