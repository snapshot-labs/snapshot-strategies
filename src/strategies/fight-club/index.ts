// import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'MantisClone';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account, uint256 id) external view returns (uint256);',
  'function balanceOf(address account) external view returns (uint256)'
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
  Object.entries(options.gloves).forEach(([gloveAddress]) => {
    addresses.forEach((address: string) => {
      multi.call(`${address}.gloves.${gloveAddress}`, gloveAddress, 'balanceOf', [address]);
    })
  });
  Object.entries(options.weightClassTokenIds).forEach(([weightClassId]) => {
    addresses.forEach((address: string) => {
      multi.call(`${address}.weightClasses.${weightClassId}`, options.weightClassAddress, 'balanceOf', [address, weightClassId]);
    })
  });

  const result = await multi.execute();

  addresses.forEach((address: string) => {
    Object.entries(result[address].gloves).forEach(([gloveAddress, numGloves]) => {
      console.log('address',address,'gloveAddress',gloveAddress,'numGloves',numGloves);
    });
    Object.entries(result[address].weightClasses).forEach(([weightClassId, numKudos]) => {
      console.log('address',address,'weightClassId',weightClassId,'numKudos',numKudos);
    });
  })

  return Object.fromEntries(
    addresses.map((u) => [u, 1])
    // Object.entries(result).map(([address, balance]) => [
    //   address,
    //   parseFloat(formatUnits(balance, options.decimals))
    // ])
  );
}
