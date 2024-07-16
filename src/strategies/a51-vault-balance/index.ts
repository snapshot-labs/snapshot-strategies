import { getAddress } from '@ethersproject/address';
import { Multicaller, subgraphRequest } from '../../utils';

export const author = 'rafaqat11';
export const version = '0.1.0';

const A51_VAULT_SUBGRAPH_URL = {
  '137':
    'https://subgrapher.snapshot.org/subgraph/arbitrum/GXc2d1wMCbyKq2F2qRo8zcCad6tXsmXubEA5F8jGKBTG'
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
    totalLiquidity: true,
    positions: {
      __args: {
        where: {
          user_in: []
        }
      },
      user: { id: true },
      balance: true
    }
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

  const vaultAddress = (options.vaultAddress as string).toLowerCase();

  const isToken0 = options.isToken0 as boolean;
  const decimals = Number(options.decimals);

  const _addresses = (addresses as string[]).map((addr) => addr.toLowerCase());

  //@ts-ignore
  params.vaults.__args.where.id = vaultAddress;

  //@ts-ignore
  params.vaults.positions.__args.where.user_in = _addresses;

  const rawData = (await subgraphRequest(
    options.subgraph || A51_VAULT_SUBGRAPH_URL[network],
    params
  )) as {
    vaults: {
      id: string;
      totalLiquidity: string;
      positions: {
        user: {
          id: string;
        };
        balance: string;
      }[];
    }[];
  };

  const multi = new Multicaller(network, provider, [vaultABI], {
    blockTag
  });
  multi.call('result', vaultAddress, vaultABI.name, []);
  const multiRes = await multi.execute();

  const userAmountShare: { [key: string]: number } = {};

  rawData.vaults[0].positions.forEach((pos) => {
    const totalAmount = isToken0
      ? Number(multiRes['result'][0])
      : Number(multiRes['result'][1]);

    userAmountShare[getAddress(pos.user.id)] =
      (Number(pos.balance) / Number(rawData.vaults[0].totalLiquidity)) *
      (totalAmount / 10 ** decimals);
  });

  return userAmountShare;
}
