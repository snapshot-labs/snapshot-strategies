import { getAddress } from '@ethersproject/address';
import { multicall } from '../../utils';
import { formatUnits } from '@ethersproject/units';

export const author = 'snapshot-labs';
export const version = '0.1.0';

const apeCoinStakingAbi = [
  'function stakedTotal(uint256[] baycTokenIds, uint256[] maycTokenIds, uint256[] bakcTokenIds) external view returns (uint256)'
];

const apeCoinStakingAddress = '0x4Ba2396086d52cA68a37D9C0FA364286e9c7835a';

const erc721Abi = [
  'function tokensOfOwnerIn(address owner, uint256 start, uint256 stop) view returns (uint256[])'
];

const baycContractAddress = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';
const maycContractAddress = '0x60E4d786628Fea6478F785A6d7e704777c86a7c6';
const bakcContractAddress = '0xba30E5F9Bb24caa003E9f2f0497Ad287FDF95623';

// Token ID ranges
const FIRST_RANGE_START = 0;
const FIRST_RANGE_END = 14999;
const SECOND_RANGE_START = 15000;
const SECOND_RANGE_END = 31000;

async function fetchNftHoldings(
  network: string,
  provider: any,
  normalizedAddresses: string[],
  nftContractAddresses: string[],
  blockTag: number | string
) {
  // Get tokens owned by each address for each contract in first range
  const firstRangePromises: Promise<any>[] = [];
  for (const contractAddress of nftContractAddresses) {
    firstRangePromises.push(
      multicall(
        network,
        provider,
        erc721Abi,
        normalizedAddresses.map((walletAddress) => [
          contractAddress,
          'tokensOfOwnerIn',
          [walletAddress, FIRST_RANGE_START, FIRST_RANGE_END]
        ]),
        { blockTag }
      )
    );
  }

  const firstRangeResults = await Promise.all(firstRangePromises);
  const maycSecondRangeResults = await multicall(
    network,
    provider,
    erc721Abi,
    normalizedAddresses.map((walletAddress) => [
      maycContractAddress,
      'tokensOfOwnerIn',
      [walletAddress, SECOND_RANGE_START, SECOND_RANGE_END]
    ]),
    { blockTag }
  );

  return {
    firstRangeResults,
    maycSecondRangeResults
  };
}

function processNftHoldings(
  normalizedAddresses: string[],
  nftContractAddresses: string[],
  firstRangeResults: any[],
  maycSecondRangeResults: any[]
) {
  const walletNftHoldings = {};

  normalizedAddresses.forEach((walletAddress, addressIndex) => {
    walletNftHoldings[walletAddress] = {
      [nftContractAddresses[0]]: [],
      [nftContractAddresses[1]]: [],
      [nftContractAddresses[2]]: []
    };

    nftContractAddresses.forEach((contractAddress, contractIndex) => {
      const nftTokenIds = firstRangeResults[contractIndex][addressIndex][0].map(
        (tokenId) => Number(tokenId.toString())
      );
      walletNftHoldings[walletAddress][contractAddress] = nftTokenIds;
    });

    // Add MAYC tokens from the second range
    const maycSecondRangeTokenIds = maycSecondRangeResults[addressIndex][0].map(
      (tokenId) => Number(tokenId.toString())
    );

    walletNftHoldings[walletAddress][maycContractAddress].push(
      ...maycSecondRangeTokenIds
    );
  });

  return walletNftHoldings;
}

async function fetchStakingBalances(
  network: string,
  provider: any,
  normalizedAddresses: string[],
  walletNftHoldings: any,
  blockTag: number | string
) {
  return await multicall(
    network,
    provider,
    apeCoinStakingAbi,
    normalizedAddresses.map((walletAddress) => [
      apeCoinStakingAddress,
      'stakedTotal',
      [
        walletNftHoldings[walletAddress][baycContractAddress],
        walletNftHoldings[walletAddress][maycContractAddress],
        walletNftHoldings[walletAddress][bakcContractAddress]
      ]
    ]),
    { blockTag }
  );
}

function formatStakingResults(
  normalizedAddresses: string[],
  stakingResults: any[]
) {
  return Object.fromEntries(
    stakingResults.map((stakingAmount, i) => [
      normalizedAddresses[i],
      parseFloat(formatUnits(stakingAmount.toString(), 18))
    ])
  );
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
  const normalizedAddresses = addresses.map(getAddress);
  const nftContractAddresses = [
    baycContractAddress,
    maycContractAddress,
    bakcContractAddress
  ];

  // Fetch all NFT holdings
  const { firstRangeResults, maycSecondRangeResults } = await fetchNftHoldings(
    network,
    provider,
    normalizedAddresses,
    nftContractAddresses,
    blockTag
  );

  // Process the NFT holdings data
  const walletNftHoldings = processNftHoldings(
    normalizedAddresses,
    nftContractAddresses,
    firstRangeResults,
    maycSecondRangeResults
  );

  // Get staked balances for each NFT token ID
  const stakingResults = await fetchStakingBalances(
    network,
    provider,
    normalizedAddresses,
    walletNftHoldings,
    blockTag
  );

  // Format and return the final results
  return formatStakingResults(normalizedAddresses, stakingResults);
}
