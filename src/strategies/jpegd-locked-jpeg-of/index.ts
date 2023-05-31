import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import { multicall } from '../../utils';
import { subgraphRequest } from '../../utils';

export const author = '0xleez';
export const version = '0.1.1';

const SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/jpegd/jpegd-core-mainnet'
};

const abi = [
  'function traitBoostPositions(uint256 _nftIndex) view returns (address owner, uint256 unlockAt, uint256 lockedValue)',
  'function ltvBoostPositions(uint256 _nftIndex) view returns (address owner, uint256 unlockAt, uint256 lockedValue)'
];

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const params = {
    jpeglocks: {
      __args: {
        where: {
          owner_in: addresses.map((address) => address.toLowerCase())
        },
        block: blockTag != 'latest' ? { number: blockTag } : null
      },
      owner: { id: true },
      collection: { id: true, nftValueProviderAddress: true },
      type: true,
      nftIndex: true,
      amount: true,
      unlockTime: true
    }
  };

  const result = await subgraphRequest(SUBGRAPH_URL[network], params);
  const jpegLocks = result.jpeglocks ?? [];

  const responses = await multicall(
    network,
    provider,
    abi,
    jpegLocks.map((jpegLock: any) => [
      getAddress(jpegLock.collection.nftValueProviderAddress),
      jpegLock.type === 'LTV' ? 'ltvBoostPositions' : 'traitBoostPositions',
      [jpegLock.nftIndex]
    ]),
    { blockTag }
  );

  return responses.reduce((acc, response, index) => {
    const jpegLock = jpegLocks[index];
    const address = getAddress(jpegLock.owner.id);

    if (!acc[address]) acc[address] = 0;

    const lockedJpeg = Number(formatUnits(response.lockedValue.toString(), 18));
    acc[address] += lockedJpeg;
    return acc;
  }, {});
}
