import { multicall } from '../../utils';

export const author = 'gregegan';
export const version = '0.1.0';

const abi = [
  'function ownerOf(uint256 tokenId) public view returns (address owner)'
];

const range = (start, end, step) =>
  Array.from({ length: (end - start) / step + 1 }, (_, i) => start + i * step);

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const { tokenIdWeightRanges } = options;
  if (tokenIdWeightRanges.length > 5) {
    throw new Error('Strategy cannot have > 5 different ranges');
  }

  const responses: Array<any> = await Promise.all(
    tokenIdWeightRanges.map(async (tokenIdWeightRange) => {
      const { start, end, weight } = tokenIdWeightRange;
      if (end - start > 7000) {
        throw new Error('Strategy range too large');
      }
      return {
        weight,
        multicall: await multicall(
          network,
          provider,
          abi,
          range(start, end, 1).map((id: any) => [
            options.address,
            'ownerOf',
            [id]
          ]),
          { blockTag }
        )
      };
    })
  );

  return Object.fromEntries(
    addresses.map((address: any) => [
      address,
      responses.reduce(
        (prev, curr) =>
          prev +
          curr.multicall.filter(
            (element: any) =>
              element.owner.toLowerCase() === address.toLowerCase()
          ).length *
            curr.weight,
        0
      )
    ])
  );
}
