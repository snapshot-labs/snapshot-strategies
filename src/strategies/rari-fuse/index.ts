// import { BigNumberish } from '@ethersproject/bignumber';
// import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'MantisClone';
export const version = '0.1.0';

const fusePoolLens = '0x6Dc585Ad66A10214Ef0502492B0CC02F0e836eec'

const abi = [
  'function getAllBorrowers() external view returns (address[] memory)',
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
  multi.call('poolUsers', options.poolAddress, 'getAllBorrowers', [])
  addresses.forEach((voterAddress) =>
    multi.call('poolAssetsWithData', fusePoolLens, 'getPoolAssetsWithData', [options.poolAddress])
  );
  const result = await multi.execute();

  const poolUsers = result.poolUsers;

  console.log(`poolUsers = ${poolUsers}`)

  return Object.fromEntries(
    result.users.map((u) => [u.id, 1])
  //   Object.entries(result).map(([address, balance]) => [
  //     address,
  //     parseFloat(formatUnits(balance, options.decimals))
  //   ])
  );
}
