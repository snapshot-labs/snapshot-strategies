import strategies from '..';

export const author = 'bshyong';
export const version = '0.2.0';

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

  if (options.strategy?.name) {
    const result = await strategies[options.strategy.name].strategy(
      space,
      network,
      provider,
      recusalList,
      options.strategy.params,
      snapshot
    );

    return Object.fromEntries(
      Object.entries(result).map(([address]) => [
        address,
        recusalList.includes(address.toLowerCase()) ? 0 : 1
      ])
    ); 
  } else {
    return Object.fromEntries(
      addresses.map((address) => [
        address,
        recusalList.includes(address.toLowerCase()) ? 0 : 1
      ])
    ); 
  }  
}
