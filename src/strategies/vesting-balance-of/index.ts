import {BigNumber, BigNumberish} from '@ethersproject/bignumber';
import {formatUnits} from '@ethersproject/units';
import {Multicaller} from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.1';


const vestingABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "wallet",
        "type": "address"
      }
    ],
    "name": "userPropertiesList",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "spentAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "vestingId",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "tgeClaimed",
            "type": "bool"
          }
        ],
        "internalType": "struct PlatformVesting.UserProperties",
        "name": "userProperties",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "vestingPropertiesList",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "amountForUser",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "tgeAmountForUser",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "startTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "tickCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "tickDuration",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "unallocatedAmount",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "active",
            "type": "bool"
          }
        ],
        "internalType": "struct PlatformVesting.VestingProperties[]",
        "name": "vestingList",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

interface Options {
  vesting_1: string,
  vesting_2?: string,
  vesting_3?: string,
  vesting_4?: string,
  vesting_5?: string,
  vesting_6?: string,
  decimals: number
}

interface VestingProperties {
  amountForUser: BigNumberish,
  tgeAmountForUser: BigNumberish,
  startTime: BigNumberish,
  tickCount: BigNumberish,
  tickDuration: BigNumberish,
  unallocatedAmount: BigNumberish,
  active: boolean
}

interface UserProperties {
  isActive: boolean,
  spentAmount: BigNumberish,
  vestingId: BigNumberish,
  tgeClaimed: boolean
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options: Options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(
    network,
    provider,
    vestingABI, { blockTag }
  );

  multi.call(options.vesting_1, options.vesting_1, 'vestingPropertiesList', [])
  if(options.vesting_2)
    multi.call(options.vesting_2, options.vesting_1, 'vestingPropertiesList', [])
  if(options.vesting_3)
    multi.call(options.vesting_3, options.vesting_1, 'vestingPropertiesList', [])
  if(options.vesting_4)
    multi.call(options.vesting_4, options.vesting_1, 'vestingPropertiesList', [])

  const vestingRecords: Record<string, VestingProperties[]> = await multi.execute();

  addresses.forEach((address: string) => {
    multi.call(address+"_"+options.vesting_1, options.vesting_1, 'userPropertiesList', [address]);
    if(options.vesting_2)
      multi.call(address+"_"+options.vesting_2, options.vesting_2, 'userPropertiesList', [address]);
    if(options.vesting_3)
      multi.call(address+"_"+options.vesting_3, options.vesting_3, 'userPropertiesList', [address])
    if(options.vesting_4)
      multi.call(address+"_"+options.vesting_4, options.vesting_4, 'userPropertiesList', [address])
    if(options.vesting_5)
      multi.call(address+"_"+options.vesting_5, options.vesting_5, 'userPropertiesList', [address])
  });
  const userProperties: Record<string, UserProperties> = await multi.execute();

  let filteredRecords : Record<string, number> = {};
  Object.entries(userProperties).forEach(([identifier, user]) => {
    const [addr, vestingBucket] = identifier.split("_");
    if(!filteredRecords[addr])
      filteredRecords[addr] = 0;

    if(!user.isActive)
      return;

    const amountRaw = vestingRecords[vestingBucket][BigNumber.from(user.vestingId).toNumber()].amountForUser
    filteredRecords[addr] += parseFloat(formatUnits(amountRaw, options.decimals));
  });

  return filteredRecords;
}
