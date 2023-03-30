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

// Arbitrum One
const lockedBalancesAddress = '0x76ba3eC5f5adBf1C58c91e86502232317EeA72dE';
const poolId =
  '0x32df62dc3aed2cd6224193052ce665dc181658410002000000000000000003bd';
const rdntToken = '0x3082cc23568ea640225c2467653db90e9250aaa0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

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

  const rdntWethLP = new Contract(
    '0x32dF62dc3aEd2cD6224193052Ce665DC18165841',
    totalSupplyAbi,
    provider
  );
  const lpTotalSupply = await rdntWethLP.totalSupply();

  const balancerVault = new Contract(
    '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    balancerVaultAbi,
    provider
  );
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
