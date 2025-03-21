import { Multicaller } from '../../utils';

export const author = 'jaybuidl';
export const version = '0.1.0';

const abi = [
  'function isRegistered(address _submissionID) external view returns (bool)'
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
    multi.call(address, options.address, 'isRegistered', [address])
  );
  const result: Record<string, number> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, registered]) => [
      address,
      Number(registered)
    ])
  );
}
