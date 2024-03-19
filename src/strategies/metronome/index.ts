import { strategy as votingStrategy } from '../vesper';

export const author = 'rokso';
export const version = '1.0.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  return votingStrategy(space, network, provider, addresses, options, snapshot);
}
