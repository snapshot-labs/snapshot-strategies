import { Multicaller } from '../../utils';
import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber'; // Added import

export const author = 'spaceh3ad';
export const version = '0.1.0';

const abi = [
  {
    inputs: [
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'address', name: '', type: 'address' }
    ],
    name: 'users',
    outputs: [
      { internalType: 'uint256', name: 'shares', type: 'uint256' },
      { internalType: 'uint256', name: 'lastDepositedTime', type: 'uint256' },
      { internalType: 'uint256', name: 'totalInvested', type: 'uint256' },
      { internalType: 'uint256', name: 'totalClaimed', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
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

  const multi = new Multicaller(network, provider, abi, { blockTag });

  const poolIds = 11;

  // Prepare multicall
  addresses.forEach((address) => {
    for (let poolId = 0; poolId < poolIds; poolId++) {
      multi.call(`${address}.${poolId}`, options.address, 'users', [
        poolId,
        address
      ]);
    }
  });

  const result = await multi.execute();

  // Initialize a mapping for user totals
  const userTotals: { [address: string]: BigNumber } = {};

  // Process the result
  for (const [key, value] of Object.entries(result)) {
    const [address /*, poolId */] = key.split('.'); // 'poolId' is unused
    const userData = value as BigNumber[]; // Explicitly define the type

    const totalInvested = userData[2]; // Index 2 corresponds to totalInvested

    if (!userTotals[address]) {
      userTotals[address] = BigNumber.from(0);
    }

    userTotals[address] = userTotals[address].add(totalInvested);
  }

  // Convert BigNumbers to formatted numbers
  const formattedResult = Object.fromEntries(
    addresses.map((address) => [
      address,
      parseFloat(
        formatUnits(
          userTotals[address] || BigNumber.from(0),
          options.decimals || 18
        )
      )
    ])
  );

  return formattedResult;
}
