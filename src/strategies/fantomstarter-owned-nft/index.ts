import { multicall } from '../../utils';

export const author = 'Igoranze';
export const version = '1.0.0';

const abi = [
  'function balanceOfBatch(address[], uint256[]) external view returns (uint256[])'
];

function calculateFSTokens(nftIdValues) {

  let totalFSTokens = 0;
  for (let i = 0; i < nftIdValues[0].length; i++) {
    let nftId = nftIdValues[0][i].toNumber();

    // Calculate the FS tokens used to purchase the NFT Tier
    // console.log(nftTierId)
    if (nftId === 1) {
      // 13,500 FS
      totalFSTokens += 13_500 ;
    } else if (nftId === 2) {
      // 26,100 FS
      totalFSTokens += 26_100 ;
    } else if (nftId === 3) {
      // 50,400 FS
      totalFSTokens += 50_400 ;
    } else if (nftId === 4) {
      // 99,000 FS
      totalFSTokens += 99_000;
    } else if (nftId === 5) {
      // 409,500 FS
      totalFSTokens += 409_500 ;
    } else if (nftId === 6) {
      //742,500 FS
      totalFSTokens += 742_500;
    } else if (nftId === 7) {
      //2,025,000 FS
      totalFSTokens += 2_025_000 ;
    } else {
      totalFSTokens += 0;
    }
  }

  return totalFSTokens;

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
    addresses.map((address: any) => [
      options.address,
      'balanceOfBatch',
      [Array(options.ids.length).fill(address), options.ids]
    ]),
    { blockTag }
  );

  return Object.fromEntries(
    response.map((values, i) => [
      addresses[i],
      calculateFSTokens(values)
    ])
  );
}
