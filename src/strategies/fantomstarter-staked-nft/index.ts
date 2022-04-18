import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'Igoranze';
export const version = '0.1.1';

const abi = [
  'function getNFTIdStaked(address _wallet) public view returns (uint256 nftIdStaked)',
];

function calculateFSTokens(nftTierId) {
  // The NFT Tier ID needs to be updated to proper number
  nftTierId = nftTierId * (10 ** 18);
  // Calculate the FS tokens used to purchase the NFT Tier
  // console.log(nftTierId)
  if (nftTierId === 1) {
    // 13,500 FS
    return 13_500 ;
  } else if (nftTierId === 2) {
    // 26,100 FS
    return 26_100 ;
  } else if (nftTierId === 3) {
    // 50,400 FS
    return 50_400 ;
  } else if (nftTierId === 4) {
    // 99,000 FS
    return 99_000;
  } else if (nftTierId === 5) {
    // 409,500 FS
    return 409_500 ;
  } else if (nftTierId === 6) {
    //742,500 FS
    return 742_500;
  } else if (nftTierId === 7) {
    //2,025,000 FS
    return 2_025_000 ;
  } else {
    return 0;
  }
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi.call(address, options.address, 'getNFTIdStaked', [address])
  );
  const result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      calculateFSTokens(parseFloat(formatUnits(balance, options.decimals)))
    ])
  );
}
