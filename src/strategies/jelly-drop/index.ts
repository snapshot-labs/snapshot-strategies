import { formatUnits } from '@ethersproject/units';
import { multicall} from '../../utils';

export const author = 'profwobble';
export const version = '0.1.3';


const jellyDropAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "earnedAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentMerkleURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "userRewards",
    "outputs": [
      {
        "internalType": "uint128",
        "name": "totalAmount",
        "type": "uint128"
      },
      {
        "internalType": "uint128",
        "name": "rewardsReleased",
        "type": "uint128"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
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

  const response = await multicall(
    network,
    provider,
    jellyDropAbi,
    [
      [options.jellyDrop, 'currentMerkleURI'],
      ...addresses.map((address: any) => [
            options.jellyDrop,
            'userRewards',
            [address]
          ])
    ],
    { blockTag }
  );

  const merkleURI: string = response[0];
  const jellyBalance = response.slice(1, response.length);

  const remappedMerkleDataRes = await fetch(
    merkleURI,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    }
  );
  const remappedMerkleRaw = await remappedMerkleDataRes.json();
  const remappedMerkleData = await remappedMerkleRaw.claims;

  const retroAddrs = Object.keys(remappedMerkleData);

  const retroUserBalances = {};
  retroAddrs.forEach((addr, i) => {
    retroUserBalances[addr.toLowerCase()] = parseFloat(
      formatUnits(remappedMerkleData[addr].amount, 18)
    );

  });

  const userWalletBalances = jellyBalance[0].map((amount, i) => {
    return [
      addresses[i].toLowerCase(),
      parseFloat(formatUnits(amount.toString(), 18))
    ];
  });
  const userRewardBalances = jellyBalance[1].map((amount, i) => {
    return [
      addresses[i].toLowerCase(),
      parseFloat(formatUnits(amount.toString(), 18))
    ];
  });
  const userTotal = {};

  userWalletBalances.forEach(([address, amount]) => {
    const addr = address.toLowerCase();
    if (userTotal[addr]) userTotal[addr] += amount;
    else userTotal[addr] = amount;
  });

  userRewardBalances.forEach(([address, amount]) => {
    const addr = address.toLowerCase();
    if (userTotal[addr]) userTotal[addr] -= amount;
    else userTotal[addr] = amount;
  });

  for (const [address, amount] of Object.entries(retroUserBalances)) {
    const addr = address.toLowerCase();
    if (userTotal[addr]) userTotal[addr] += amount;
    else userTotal[addr] = amount;
  }

  const finalUserBalances = Object.fromEntries(
    addresses.map((addr) => [addr, userTotal[addr.toLowerCase()]])
  );

  return finalUserBalances;


}
