import { multicall } from '../../utils';

export const author = 'gmaijoe';
export const version = '0.1.0';

const abi = [
  'function ownerOf(uint256 tokenId) public view returns (address owner)',
  'function currentXP(uint256 tokenId) public view returns (bool locked, uint256 current, uint256 total)' 
];

const getScore = (response, response1, address) => {
  const index = response.findIndex(
    (res: any) => res.owner.toLowerCase() === address.toLowerCase()
  );

  if (index > -1) {
    return Number(response1[index].current) > 0 ? 1 : 0;
  } else {
    return 0
  }
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const response = await multicall(
    network,
    provider,
    abi,
    options.tokenIds.map((id: any) => [options.address, 'ownerOf', [id]]),
    { blockTag }
  );

  const response2 = await multicall(
    network,
    provider,
    abi,
    options.tokenIds.map((id: any) => [options.address, 'currentXP', [id]]),
    { blockTag }
  );

  const finalResult = Object.fromEntries(
    addresses.map((address: any) => [
      address,
      getScore(response, response2, address)
      
    ])
  );

  return finalResult
}