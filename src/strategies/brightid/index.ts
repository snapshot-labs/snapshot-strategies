import { multicall } from '../../utils';
import { subgraphRequest } from '../../utils';
import { getProvider } from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.1';

const abi = [
  'function isVerifiedUser(address _user) external view returns (bool)'
];

const official = new Map([
  ['v5', '0x81591DC4997A76A870c13D383F8491B288E09344']
]);

async function getIDChainBlock(snapshot, provider) {
  const ts = (await provider.getBlock(snapshot)).timestamp;
  const query = {
    blocks: {
      __args: {
        where: {
          ts: ts,
          network_in: ['74']
        }
      },
      number: true
    }
  };
  const url = 'https://blockfinder.snapshot.org';
  const data = await subgraphRequest(url, query);
  return data.blocks[0].number;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const isOfficial = options.registry.charAt(0) == 'v';
  const blockTag =
    typeof snapshot === 'number'
      ? isOfficial
        ? await getIDChainBlock(snapshot, provider)
        : snapshot
      : 'latest';
  const response = await multicall(
    isOfficial ? '74' : network,
    getProvider(isOfficial ? '74' : network),
    abi,
    addresses.map((address: any) => [
      isOfficial ? official.get(options.registry) : options.registry,
      'isVerifiedUser',
      [address]
    ]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map((value, i) => [addresses[i], value[0] ? 1 : 0])
  );
}
