import strategies from '..';

export const author = 'joaomajesus';
export const version = '1.0.0';

let _options;

function applyBlackList(address: string, result) {
  return (_options.blacklist as Array<string>).includes(address) ? 0 : result;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  _options = options;

  const result = await strategies[options.strategy.name].strategy(
    space,
    network,
    provider,
    addresses,
    options.strategy.params,
    snapshot
  );

  const entries = new Map<PropertyKey, any>();

  for (const [address, value] of Object.entries(result)) {
    entries.set(address, applyBlackList(address, value));
  }

  return Object.fromEntries(entries);
}
