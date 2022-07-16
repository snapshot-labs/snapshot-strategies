import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { MaxUint256 } from '@ethersproject/constants';
import { Multicaller } from '../../utils';

export const author = 'MantisClone';
export const version = '0.1.0';

const fusePoolLens = '0x6Dc585Ad66A10214Ef0502492B0CC02F0e836eec'
const fusePoolLensImplementation = '0x6bcc070637a6eb4a13df47b906e4017530fd125d'

const absMaxHealth = MaxUint256 // show all users

const abi = [
  'function getPoolUsersWithData(address comptroller,uint256 maxHealth) returns (FusePoolUser[], uint256, uint256)'
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
  addresses.forEach((voterAddress) =>
    multi.call('poolUsersWithData', fusePoolLens, 'getPoolUsersWithData', [options.poolAddress, absMaxHealth])
  );
  const result: Record<string, BigNumberish> = await multi.execute();

  const poolUsersWithData = result.poolUsersWithData;

  console.log(`poolUsersWithData = ${poolUsersWithData}`);

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
