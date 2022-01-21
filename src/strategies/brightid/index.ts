import { multicall } from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.1';

const abi = [
  'function isVerifiedUser(address _user) external view returns (bool)'
];

const official = new Map([
  ["v5", "0x81591DC4997A76A870c13D383F8491B288E09344"]
]);

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const registry = options.registry[0] == "v" ? official[options.registry] : options.registry;
  const response = await multicall(
    options.registry[0] == "v" ? "74" : network,
    provider,
    abi,
    addresses.map((address: any) => [
      registry,
      'isVerifiedUser',
      [address]
    ]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map((value, i) => [addresses[i], value[0] ? 1 : 0])
  );
}
