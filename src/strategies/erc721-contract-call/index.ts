import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import { multicall } from '../../utils';

export const author = 'abysnart';
export const version = '1.0.0';
export const name = 'xSGT NFT Voting Power';
export const description = 'Strategy for xSGT NFT where each token ID has a specific voting power';

// Define interfaces
interface StrategyOptions {
  address: string;
  symbol: string;
  decimals: number;
}

type Scores = Record<string, number>;

// Define ABIs for the required calls
const abi = [
  // Get all tokens owned by an address
  'function tokensOfOwner(address _owner) external view returns (uint256[])',
  // Get voting power for a specific token ID
  'function getVotingPower(uint256 _tokenId) external view returns (uint256)'
];

export async function strategy(
  space: string,
  network: string,
  provider: any,
  addresses: string[],
  options: StrategyOptions,
  snapshot: number | string
): Promise<Scores> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const contractAddress = options.address; // NFT contract address
  
  const scores: Scores = {};
  const addressesLowercased = addresses.map(address => address.toLowerCase());
  
  // Initialize scores with 0
  addressesLowercased.forEach(address => {
    scores[getAddress(address)] = 0;
  });
  
  // First, get all token IDs owned by each address
  const tokenOwnershipCalls = addresses.map(address => {
    return {
      target: contractAddress,
      params: [address],
      name: 'tokensOfOwner'
    };
  });
  
  const multi = new multicall(provider, network);
  const ownershipResponse: any[][] = await multi.call(
    network,
    provider,
    abi,
    tokenOwnershipCalls,
    { blockTag }
  );
  
  // Prepare calls to get voting power for each token ID
  const votingPowerCalls: { target: string; params: string[]; name: string }[] = [];
  const addressIndices: number[] = [];
  
  addresses.forEach((address, addrIndex) => {
    const tokenIds = ownershipResponse[addrIndex] || [];
    
    // For each token ID owned by this address, prepare a call to get its voting power
    tokenIds.forEach((tokenId: any) => {
      votingPowerCalls.push({
        target: contractAddress,
        params: [tokenId.toString()],
        name: 'getVotingPower'
      });
      addressIndices.push(addrIndex);
    });
  });
  
  if (votingPowerCalls.length === 0) {
    return scores;
  }
  
  // Make calls to get voting power for each token ID
  const votingPowerResponse: any[][] = await multi.call(
    abi,
    votingPowerCalls,
    { blockTag }
  );
  
  // Sum up voting power for each address
  votingPowerResponse.forEach((power, index) => {
    const addressIndex = addressIndices[index];
    const address = getAddress(addresses[addressIndex]);
    
    // Add this token's voting power to the address's total
    if (power && power[0]) {
      scores[address] += parseFloat(formatUnits(power[0], 0));
    }
  });
  
  return scores;
}