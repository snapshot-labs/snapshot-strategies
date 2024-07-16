import { getAddress } from '@ethersproject/address';
import { Multicaller, subgraphRequest } from '../../utils';

export const author = 'rafaqat11';
export const version = '0.1.0';

const A51_STAKING_SUBGRAPH_URL = {
  '137':
    'https://subgrapher.snapshot.org/subgraph/arbitrum/mr29ZjZSuNs6iNhD8YmNnEg3JB17muNbGp1PCYxusr7'
};

const vaultABI = {
  inputs: [],
  name: 'getPositionDetails',
  outputs: [
    { internalType: 'uint256', name: 'amount0', type: 'uint256' },
    { internalType: 'uint256', name: 'amount1', type: 'uint256' },
    { internalType: 'uint256', name: 'fees0', type: 'uint256' },
    { internalType: 'uint256', name: 'fees1', type: 'uint256' },
    { internalType: 'uint128', name: 'baseLiquidity', type: 'uint128' },
    { internalType: 'uint128', name: 'rangeLiquidity', type: 'uint128' }
  ],
  stateMutability: 'nonpayable',
  type: 'function'
};

const params = {
  vaults: {
    __args: {
      where: {
        id: ''
      }
    },
    id: true,
    stakingAddress: true,
    totalLpLocked: true
  },
  rewards: {
    __args: {
      where: {
        vault: '',
        userAddress_in: []
      }
    },
    vault: { id: true },
    userAddress: true,
    stakingAddress: true,
    totalUserLockedLp: true
  }
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const farmingVaultAddress = (
    options.farmingVaultAddress as string
  ).toLowerCase();

  const isToken0 = options.isToken0 as boolean;
  const decimals = Number(options.decimals);

  const _addresses = (addresses as string[]).map((addr) => addr.toLowerCase());

  //@ts-ignore
  params.vaults.__args.where.id = farmingVaultAddress;

  //@ts-ignore
  params.rewards.__args.where.vault = farmingVaultAddress;

  //@ts-ignore
  params.rewards.__args.where.userAddress_in = _addresses;

  const rawData = (await subgraphRequest(
    options.subgraph || A51_STAKING_SUBGRAPH_URL[network],
    params
  )) as {
    vaults: {
      id: string;
      stakingAddress: string;
      totalLpLocked: string;
    }[];
    rewards: {
      vault: { id: string };
      userAddress: string;
      stakingAddress: string;
      totalUserLockedLp: string;
    }[];
  };

  const vaultAddress = rawData.vaults[0].stakingAddress;
  const totalLpLocked = rawData.vaults[0].totalLpLocked;

  const multi = new Multicaller(network, provider, [vaultABI], {
    blockTag
  });
  multi.call('result', vaultAddress, vaultABI.name, []);
  const multiRes = await multi.execute();

  const userAmountShare: { [key: string]: number } = {};

  rawData.rewards.forEach((reward) => {
    const totalAmount = isToken0
      ? Number(multiRes['result'][0])
      : Number(multiRes['result'][1]);

    userAmountShare[getAddress(reward.userAddress)] =
      (Number(reward.totalUserLockedLp) / Number(totalLpLocked)) *
      (totalAmount / 10 ** decimals);
  });

  return userAmountShare;
}
