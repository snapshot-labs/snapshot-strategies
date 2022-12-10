import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import { multicall } from '../../utils';
import { subgraphRequest } from '../../utils';

export const author = '0xleez';
export const version = '0.1.0';

const UNISWAP_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/jpegd/jpegd-core-mainnet'
};

const abi = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    name: 'traitBoostPositions',
    outputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'unlockAt',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'lockedValue',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    name: 'ltvBoostPositions',
    outputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'unlockAt',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'lockedValue',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const { collectionToProviderAddress } = options;

  const params = {
    jpeglocks: {
      __args: {
        where: {
          owner_in: addresses.map((address) => address.toLowerCase())
        }
      },
      owner: { id: true },
      collection: { id: true },
      type: true,
      nftIndex: true,
      amount: true,
      unlockTime: true
    }
  };

  const result = await subgraphRequest(UNISWAP_SUBGRAPH_URL[network], params);
  const jpegLocks = result.jpeglocks ?? [];

  const responses = await multicall(
    network,
    provider,
    abi,
    jpegLocks.map((jpegLock: any) => [
      collectionToProviderAddress[jpegLock.collection.id],
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
