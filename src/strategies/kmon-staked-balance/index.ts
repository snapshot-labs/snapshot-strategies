import { multicall } from '../../utils';

export const author = 'umbecanessa';
export const version = '0.1.1';

const stakingAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  console.log('Starting strategy execution...');
  console.log('Network:', network);
  console.log('Addresses to process:', addresses);
  console.log('Staking contract address:', options.stakingAddress);
  console.log('Snapshot block:', snapshot);

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  console.log('Block Tag:', blockTag);

  // Set up the multicall
  const calls = addresses.map((address: any) => [
    options.stakingAddress,
    'balanceOf',
    [address]
  ]);
  console.log('Prepared multicall requests:', calls);

  console.log('Executing multicall...');
  const res = await multicall(network, provider, stakingAbi, calls, { blockTag });
  console.log('Multicall response:', res);

  // Return the balances as voting power
  const formattedResult = Object.fromEntries(
    res.map((value, i) => [
      addresses[i],
      parseFloat(value) / 10 ** options.decimals // Format balance using the token decimals
    ])
  );
  console.log('Formatted result:', formattedResult);

  return formattedResult;
}
