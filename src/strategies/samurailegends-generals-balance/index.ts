import { Multicaller } from '../../utils';

export const author = 'Samurai-Legends';
export const version = '0.2.0';

const abi = [
  'function erc721BatchOwnerOf(address nftAddress, uint idMin, uint idMax) external view returns (address[] memory)'
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

  multi.call('batch.owners', options.batchAddress, 'erc721BatchOwnerOf', [
    options.nftAddress,
    '0',
    options.treshold.toString()
  ]);
  const result = await multi.execute();

  const balances = result.batch.owners.reduce(
    (prev: Record<string, number>, curr: string) => {
      if (curr in prev) prev[curr] += 1;
      else prev[curr] = 1;
      return prev;
    },
    {}
  );

  return Object.fromEntries(
    addresses.map((address: string) => {
      const balance = balances[address] || 0;
      return [address, balance * options.multiplier];
    })
  );
}
