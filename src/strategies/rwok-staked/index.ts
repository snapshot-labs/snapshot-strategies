import { BigNumber } from '@ethersproject/bignumber';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';

export const author = 'rwok';
export const version = '0.1.0';

const abi = [
  'function getStakeInfo(address account) external view returns (uint256[], uint256)'
];

const STAKING_CONTRACT = '0x2C0973b082491948A48180D2bf528E7B51D44Eec';
const NFT_MULTIPLIER = 300030;

// Base network chainId is 8453
const SUPPORTED_NETWORKS = ['8453'];

export async function strategy(
  space: string,
  network: string,
  provider: StaticJsonRpcProvider,
  addresses: string[],
  options: any,
  snapshot: number | 'latest'
): Promise<Record<string, number>> {
  if (!SUPPORTED_NETWORKS.includes(network)) {
    throw new Error('Unsupported network. This strategy only works on Base network.');
  }

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const contract = new Contract(STAKING_CONTRACT, abi, provider);

  const stakes = await Promise.all(
    addresses.map(async (address) => {
      try {
        const [tokenIds, rewards] = await contract.getStakeInfo(address, { blockTag });
        return [address, tokenIds.length] as [string, number];
      } catch (error) {
        console.error(`Error fetching stake info for ${address}:`, error);
        return [address, 0] as [string, number];
      }
    })
  );

  // Calculate voting power by multiplying number of staked NFTs by NFT multiplier
  return Object.fromEntries(
    stakes.map(([address, numStaked]) => [
      address,
      numStaked * NFT_MULTIPLIER
    ])
  );
} 