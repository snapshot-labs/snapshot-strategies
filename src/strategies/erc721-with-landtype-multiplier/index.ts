import { multicall } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'monish-nagre';
export const version = '0.1.0'; 

const abi = [
  'function balanceOf(address owner) public view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256)',
  'function landData(uint256 tokenId) public view returns (uint256 landId, string landType, string x, string y, string z)'
];

// Voting power based on land type
const landTypeVotingPower: { [key: string]: number } = {
  'Mega': 25000,
  'Large': 10000,
  'Medium': 4000,
  'Unit': 2000
};

export async function strategy(
  space: string,
  network: string,
  provider: any,
  addresses: string[],
  options: any,
  snapshot: number | string
): Promise<{ [address: string]: number }> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  try {
    // Step 1: Get the balance of each address
    const balanceCalls = addresses.map((address: string) => [options.address, 'balanceOf', [address]]);
    const balanceResponse = await multicall(network, provider, abi, balanceCalls, { blockTag });

    // Check if balanceResponse is an array and has valid data
    if (!Array.isArray(balanceResponse) || balanceResponse.length !== addresses.length) {
      throw new Error('Balance response is not valid');
    }

    // Parse balance response
    const balances = balanceResponse.map((response: any) => BigNumber.from(response[0]).toNumber());
    console.log('Balance response:', balances);

    // Step 2: Get all token IDs for each address
    const tokenCalls: [string, string, [string, number]][] = [];
    addresses.forEach((address: string, i: number) => {
      const balance = balances[i];
      for (let j = 0; j < balance; j++) {
        tokenCalls.push([options.address, 'tokenOfOwnerByIndex', [address, j]]);
      }
    });

    if (tokenCalls.length === 0) {
      return {};
    }

    const tokenResponse = await multicall(network, provider, abi, tokenCalls, { blockTag });

    // Check if tokenResponse is an array and has valid data
    if (!Array.isArray(tokenResponse)) {
      throw new Error('Token response is not an array');
    }

    // Parse token response
    const tokenIds = tokenResponse.map((response: any) => BigNumber.from(response[0]).toString());
    console.log('Token response:', tokenIds);

    // Step 3: Get land type for each token ID
    const landDataCalls: [string, string, [BigNumber]][] = tokenIds.map((tokenId: string) => [options.address, 'landData', [BigNumber.from(tokenId)]]);
    const landDataResponse = await multicall(network, provider, abi, landDataCalls, { blockTag });

    // Check if landDataResponse is an array and has valid data
    if (!Array.isArray(landDataResponse) || landDataResponse.length !== tokenIds.length) {
      throw new Error('Land data response is not valid');
    }

    // Step 4: Calculate voting power based on land type
    const votingPower: { [address: string]: number } = {};
    let tokenIndex = 0;
    addresses.forEach((address: string, i: number) => {
      votingPower[address] = 0;
      const balance = balances[i];
      for (let j = 0; j < balance; j++) {
        const landType = landDataResponse[tokenIndex].landType;
        votingPower[address] += landTypeVotingPower[landType] || 0;
        tokenIndex++;
      }
    });

    console.log('Voting power:', votingPower);

    return votingPower;
  } catch (error) {
    return {};
  }
}