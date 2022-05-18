export const author = 'bshyong';
export const version = '0.1.1';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const recusalList = options?.addresses.map((address) => {
    return address.toLowerCase();
  });

  return Object.fromEntries(
    addresses.map((address) => [
      address,
      recusalList.includes(address.toLowerCase()) ? 0 : 1
    ])
  );
}
