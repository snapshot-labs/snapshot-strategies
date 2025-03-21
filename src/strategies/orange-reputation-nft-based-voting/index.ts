import { multicall } from '../../utils';

export const author = 'orange-protocol';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenProperty(uint256 tokenId) view returns (tuple(tuple(string dpdid, string dpTitle, string dpmethod, string dpmethodTitle, string apdid, string apTitle, string apmethod, string apmethodTitle, uint256 validDays, string image) category, uint256 score, uint256 validTo, address originOwner))'
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
