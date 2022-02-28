import { multicall } from '../../utils';

export const author = 'orange-protocol';
export const version = '0.1.0';

const abi = [
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'uint256', name: 'index', type: 'uint256' }
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'tokenProperty',
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: 'string',
                name: 'dpdid',
                type: 'string'
              },
              {
                internalType: 'string',
                name: 'dpTitle',
                type: 'string'
              },
              {
                internalType: 'string',
                name: 'dpmethod',
                type: 'string'
              },
              {
                internalType: 'string',
                name: 'dpmethodTitle',
                type: 'string'
              },
              {
                internalType: 'string',
                name: 'apdid',
                type: 'string'
              },
              {
                internalType: 'string',
                name: 'apTitle',
                type: 'string'
              },
              {
                internalType: 'string',
                name: 'apmethod',
                type: 'string'
              },
              {
                internalType: 'string',
                name: 'apmethodTitle',
                type: 'string'
              },
              {
                internalType: 'uint256',
                name: 'validDays',
                type: 'uint256'
              },
              {
                internalType: 'string',
                name: 'image',
                type: 'string'
              }
            ],
            internalType: 'struct OrangeReputation.Category',
            name: 'category',
            type: 'tuple'
          },
          {
            internalType: 'uint256',
            name: 'score',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'validTo',
            type: 'uint256'
          },
          {
            internalType: 'address',
            name: 'originOwner',
            type: 'address'
          }
        ],
        internalType: 'struct OrangeReputation.tokenDetail',
        name: '',
        type: 'tuple'
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
  { contract, symbol },
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const runMultiCall = (calls: any[]) =>
    multicall(network, provider, abi, calls, { blockTag });

  // Get nft count of user
  const countResponse = await runMultiCall(
    addresses.map((address: any) => [contract, 'balanceOf', [address]])
  );
  const countList: string[] = countResponse.map((item) => item.toString());

  // Get id of user owned nft by index
  const idCallList = countList.reduce((prev: any[], curr, index) => {
    if (curr === '0') {
      return prev;
    }
    const currAddressCalls = Array.from({
      length: Number(curr)
    }).map((val, i) => [
      contract,
      'tokenOfOwnerByIndex',
      [addresses[index], i]
    ]);
    return prev.concat(currAddressCalls);
  }, []);
  const idResponse = await runMultiCall(idCallList);

  // Get properties of every nft
  const propertyCalls = idResponse.map((item) => [
    contract,
    'tokenProperty',
    [Number(item)]
  ]);
  const propertyResponse = await runMultiCall(propertyCalls);
  const now = Date.now();
  const nftList = propertyResponse
    .map(([first]) => ({
      owner: first.originOwner,
      score: first.score.toNumber(),
      validTo: first.validTo.toString(),
      apMethod: first.category.apmethod
    }))
    .filter((item) => item.apMethod === symbol && item.validTo * 1000 > now);

  return Object.fromEntries(
    addresses.map((value) => [
      value,
      nftList
        .reverse()
        .find((item) => item.owner.toUpperCase() === value.toUpperCase())
        ?.score || 0
    ])
  );
}
