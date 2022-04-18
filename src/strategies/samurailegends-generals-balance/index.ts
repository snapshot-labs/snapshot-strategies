import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'Samurai Legends';
export const version = '0.1.0';

const abi = [
  'function erc721GetAllTokensOfOwner(address nftAddress, address user) external view returns (uint[] memory)'
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
  process.stdout.write(`\nMulticall: ${JSON.stringify(multi)}\n`);
  addresses.forEach((address) => {
    process.stdout.write(`\nContract Address: ${options.address}\n`);
    process.stdout.write(`\nUser Address: ${address}\n`);
    process.stdout.write(`\nNft Address: ${options.nftAddress}\n`);
    multi.call(address, options.address, 'erc721GetAllTokensOfOwner', [
      options.nftAddress,
      address
    ]);
  });
  const result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
