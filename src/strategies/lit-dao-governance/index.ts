import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import { multicall } from '../../utils';
import { strategy as masterchefStrategy } from '../masterchef-pool-balance';

export const author = 'wizardlabsxyz';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
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

  const degenContract = '0x5f5541C618E76ab98361cdb10C67D1dE28740cC3';

  // Use the existing masterchef strategy to get the staked lit balance
  const stakedLitResults = await masterchefStrategy(
    space,
    network,
    provider,
    addresses,
    {
      pid: '0',
      symbol: 'Staked LIT',
      weight: 1,
      tokenIndex: null,
      chefAddress: '0x6c4f932a367ebbfef5528022459b47274618aaaf',
      uniPairAddress: null,
      weightDecimals: 0
    },
    snapshot
  );

  // Book
  // LP2
  // LP2F
  // Squiggle
  // Degenaissance
  const contracts: string[] = [
    '0x915bDf48e61fB3Cb39c8339Fb10108D9B596171C',
    '0xFC0946B334B3bA133D239207a4d01Da1B75CF51B',
    '0x76723D9524a743d8908458082FBdFAAf7F60B3eD',
    '0x6F75bEAa3D3d8A15e08a9F499464C696fC4D4cde',

    // DEGEN HAS TO BE LAST FOR THE MULTIPLIER
    degenContract
  ];

  const calls: any[] = [];
  contracts.forEach((contract) => {
    addresses.forEach((address: any) => {
      calls.push([contract, 'balanceOf', [address]]);
    });
  });

  const response = await multicall(network, provider, abi, calls, { blockTag });

  const merged = {};
  const degenOwnership = {};
  response.map((value: any, i: number) => {
    const address = calls[i][2][0];
    merged[address] = (merged[address] || 0) as number;

    const parsedValue = parseFloat(formatUnits(value.toString(), 0));
    if (calls[i][0] == degenContract && parsedValue > 0) {
      // Track degen ownership to apply multiplier to staked lit balance later
      degenOwnership[address] = true;

      // Apply degen multiplier to NFT based voting power
      merged[address] *= 2;
    } else {
      merged[address] += parsedValue;
    }
  });

  Object.keys(stakedLitResults).map((address: any) => {
    const stakedLitVotingPower = Math.floor(
      stakedLitResults[address] / 3000000
    );
    if (degenOwnership[address]) {
      merged[address] += stakedLitVotingPower * 2;
    } else {
      merged[address] += stakedLitVotingPower;
    }
  });

  return Object.fromEntries(
    Object.entries(merged).map((address: any) => [
      getAddress(address[0]),
      address[1]
    ])
  );
}
