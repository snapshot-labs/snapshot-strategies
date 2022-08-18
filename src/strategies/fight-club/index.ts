// import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'MantisClone';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function balanceOf(address account, uint256 id) external view returns (uint256);'
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

  console.log(options.gloves);

  const multi = new Multicaller(network, provider, abi, { blockTag });
  options.gloves.forEach((gloveAddress: string) => {
    addresses.forEach((address: string) => {
      multi.call(`${address}.gloves.${gloveAddress}`, gloveAddress, 'balanceOf', [address]);
    })
  });
  // options.weightClassTokenIds.forEach((id: number) => {
  //   addresses.forEach((address: string) => {
  //     multi.call(`${address}.weightClasses.${id}`, options.weightClassAddress, 'balanceOf', [address, id]);
  //   })
  // });

  const result = await multi.execute();

  // result.forEach((address: string) => {
  //   result[address].gloves.forEach([gloveAddress, num]) => {

  //   })
  // })

  return Object.fromEntries(
    result.map((u) => [u, 1])
    // Object.entries(result).map(([address, balance]) => [
    //   address,
    //   parseFloat(formatUnits(balance, options.decimals))
    // ])
  );
}
