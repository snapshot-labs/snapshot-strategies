import { Multicaller } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';
import { getAddress } from '@ethersproject/address';
import { Contract } from '@ethersproject/contracts';

export const author = 'JDoy99';
export const version = '0.1.0';

const lockedBalancesAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address'
      }
    ],
    name: 'lockedBalances',
    outputs: [
      {
        internalType: 'uint256',
        name: 'total',
        type: 'uint256'
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256'
          }
        ],
        internalType: 'struct LockedBalance[]',
        name: 'lockData',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

const totalSupplyAbi = [
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

const pancakeLPAbi = [
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getReserves',
    outputs: [
      {
        internalType: 'uint112',
        name: '_reserve0',
        type: 'uint112'
      },
      {
        internalType: 'uint112',
        name: '_reserve1',
        type: 'uint112'
      },
      {
        internalType: 'uint32',
        name: '_blockTimestampLast',
        type: 'uint32'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

const balancerVaultAbi = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'poolId',
        type: 'bytes32'
      },
      {
        internalType: 'contract IERC20',
        name: 'token',
        type: 'address'
      }
    ],
    name: 'getPoolTokenInfo',
    outputs: [
      {
        internalType: 'uint256',
        name: 'balance',
        type: 'uint256'
      }
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

  let lockedBalancesAddress;
  let poolId;
  let rdntToken;
  let rdntLP;
  let balancerVault;

  if (network === 42161) {
    lockedBalancesAddress = '0x76ba3eC5f5adBf1C58c91e86502232317EeA72dE';
    poolId =
      '0x32df62dc3aed2cd6224193052ce665dc181658410002000000000000000003bd';
    rdntToken = '0x3082cc23568ea640225c2467653db90e9250aaa0';
    rdntLP = new Contract(
      '0x32dF62dc3aEd2cD6224193052Ce665DC18165841',
      totalSupplyAbi,
      provider
    );
    balancerVault = new Contract(
      '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      balancerVaultAbi,
      provider
    );
  } else if (network === 56) {
    lockedBalancesAddress = '0x4FD9F7C5ca0829A656561486baDA018505dfcB5E';
    rdntToken = '0xf7DE7E8A6bd59ED41a4b5fe50278b3B7f31384dF';
    rdntLP = new Contract(
      '0x346575fc7f07e6994d76199e41d13dc1575322e1',
      pancakeLPAbi,
      provider
    );
  }

  const multi = new Multicaller(network, provider, lockedBalancesAbi, {
    blockTag
  });

  addresses.forEach((address) => {
    multi.call(
      `${address}.lockedBalances`,
      lockedBalancesAddress,
      'lockedBalances',
      [address]
    );
  });

  const result = await multi.execute();
  const lpTotalSupply = await rdntLP.totalSupply();
  const rdntInVault = await balancerVault.getPoolTokenInfo(poolId, rdntToken);


  return Object.fromEntries(
    Object.entries(result).map(([address, value]: any) => {
      const lockedBalances = value.lockedBalances as { total: string };
      const totalLocked = BigNumber.from(lockedBalances.total);
      const totalLockedFormatted = parseFloat(totalLocked.toString());
      const lpShare = totalLockedFormatted / lpTotalSupply;
      const rdntOwned = (lpShare * rdntInVault) / 1e18;
      return [getAddress(address), rdntOwned];
    })
  );
}
