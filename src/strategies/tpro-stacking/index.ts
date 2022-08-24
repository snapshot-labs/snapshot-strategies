import { multicall } from '../../utils';
import { formatEther } from '@ethersproject/units';

export const author = 'tokenomia-pro';
export const version = '1.0.0';

const abi = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "userInfo",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "rewardDebt",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "pendingRewards",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lockedTimestamp",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lockupTimestamp",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lockupTimerange",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "virtAmount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  }
];

interface StrategyOptions {
  address: string;
  symbol: string;
  decimals: number;
  smartContracts: Array<string>;
  contractFactor: Array<number>;
  powerFactor: number;
}

interface VotingPower {
  [key: string]: number;
}

export async function strategy(
  space: string,
  network: string,
  provider,
  addresses: string[],
  options: StrategyOptions,
  snapshot: number
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const promises: any[] = [];

  options.smartContracts.forEach(contract => {
    promises.push(multicall(
      network,
      provider,
      abi,
      addresses.map((address: any) => [
        contract.toLowerCase(),
        'userInfo',
        [0, address.toLowerCase()]
      ]),
      { blockTag }
    ));
  });

  const resolvedPromises = await Promise.all(promises);
  const votingPowers: Array<VotingPower> = [];

  resolvedPromises.forEach((response, contractIdx) => {
    const contractFactor = options.contractFactor[contractIdx];
    const currentTimestamp = Math.floor(Date.now() / 1000);

    for (let i = 0; i < response.length; i++) {
      const user = addresses[i];
      const endTimestamp = Number(response[i].lockedTimestamp);
      const tokensAmount = Number(formatEther(response[i].amount));
      const remainMonths = Number(endTimestamp - currentTimestamp)/(60 * 60 * 24 * 30);

      if(tokensAmount <= 0 || remainMonths <= 0) {
        continue;
      }

      const votePower = Math.floor(tokensAmount * Math.pow(remainMonths, options.powerFactor) * contractFactor);

      if(votePower && votingPowers[user]) {
        votingPowers[user] += votePower;
      }
      else if(votePower) {
        votingPowers[user] = votePower;
      }
    }
  });

  return votingPowers || [];
}
