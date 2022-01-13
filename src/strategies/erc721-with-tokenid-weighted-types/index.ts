import { multicall } from '../../utils';

export const author = 'gregegan';
export const version = '0.1.0';

const abi = [
  'function ownerOf(uint256 tokenId) public view returns (address owner)'
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
  const responsePrimary = await multicall(
    network,
    provider,
    abi,
    options.tokenIdsPrimary.map((id: any) => [
      options.address,
      'ownerOf',
      [id]
    ]),
    { blockTag }
  );

  const responseSecondary = await multicall(
    network,
    provider,
    abi,
    options.tokenIdsSecondary.map((id: any) => [
      options.address,
      'ownerOf',
      [id]
    ]),
    { blockTag }
  );

  return Object.fromEntries(
    addresses.map((address: any) => [
      address,
      responsePrimary.filter(
        (element: any) => element.owner.toLowerCase() === address.toLowerCase()
      ).length *
        options.primaryWeight +
        responseSecondary.filter(
          (element: any) =>
            element.owner.toLowerCase() === address.toLowerCase()
        ).length *
          options.secondaryWeight
    ])
  );
}
