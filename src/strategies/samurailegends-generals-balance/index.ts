import { Multicaller } from '../../utils';

export const author = 'Samurai-Legends';
export const version = '0.1.2';

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
  addresses.forEach((address) =>
    multi.call(address, options.address, 'erc721GetAllTokensOfOwner', [
      options.nftAddress,
      address
    ])
  );
  const result: Record<string, number[]> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, nftBalance]) => {
      const balance = nftBalance.reduce((prev, curr) => {
        if (curr >= 0 && curr < 5000) return prev + 1;
        return prev;
      }, 0);
      return [address, balance];
    })
  );
}
