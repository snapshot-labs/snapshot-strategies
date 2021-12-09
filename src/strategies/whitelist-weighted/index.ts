export const author = 'vsergeev';
export const version = '0.1.0';

export async function strategy(space, network, provider, addresses, options) {
  const whitelist = Object.fromEntries(
    Object.entries(options?.addresses).map(([addr, weight]) => [
      addr.toLowerCase(),
      weight
    ])
  );
  return Object.fromEntries(
    addresses.map((address) => [address, whitelist[address.toLowerCase()] || 0])
  );
}
