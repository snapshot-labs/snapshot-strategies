import { formatUnits } from '@ethersproject/units';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';

export const author = 'saffron.finance';
export const version = '2.0.0';

const SAFF_STAKING_V2 = '0x4eB4C5911e931667fE1647428F38401aB1661763';
const SFI = '0xb753428af26E81097e7fD17f40c88aaA3E04902c';
const tenTo18 = BigNumber.from(10).pow(18);
const STAKING_VOTE_BOOST_DEFAULT = 1.1;

type PoolInfo = {
  id: BigNumber;
  lpToken: LpSfiPair;
};

type LpSfiPair = {
  lpAddress: string;
  token0: string;
  token1: string;
  sfiReserve: BigNumber;
  totalSupply: BigNumber;
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
  const multi = new Multicaller(network, provider, abi, { blockTag });
  const pools = new Array<PoolInfo>();

  // ========== Prepare pools' lp token data ==========
  multi.call('poolLength', SAFF_STAKING_V2, 'poolLength', []);
  const poolLenResult: Record<string, BigNumberish> = await multi.execute();

  const poolLength = BigNumber.from(poolLenResult.poolLength).toNumber();
  for (let i = 0; i < poolLength; i++) {
    const path = `poolInfo[${i}]`;
    multi.call(path, SAFF_STAKING_V2, 'poolInfo', [BigNumber.from(i)]);
  }
  const poolInfoResults = await multi.execute();
  for (let i = 0; i < poolLength; i++) {
    const lp: LpSfiPair = {
      lpAddress: poolInfoResults.poolInfo[i].lpToken,
      token0: '',
      token1: '',
      sfiReserve: BigNumber.from(0),
      totalSupply: BigNumber.from(0)
    };
    const pool: PoolInfo = {
      id: BigNumber.from(i),
      lpToken: lp
    };
    pools.push(pool);
  }

  for (let i = 0; i < poolLength; i++) {
    const lpAddress = pools[i].lpToken.lpAddress;
    if (lpAddress === SFI) {
      multi.call(`reserves[${i}]`, lpAddress, 'balanceOf', [SAFF_STAKING_V2]);
      multi.call(`supply[${i}]`, lpAddress, 'totalSupply', []);
    } else {
      multi.call(`token0[${i}]`, lpAddress, 'token0', []);
      multi.call(`token1[${i}]`, lpAddress, 'token1', []);
      multi.call(`reserves[${i}]`, lpAddress, 'getReserves', []);
      multi.call(`supply[${i}]`, lpAddress, 'totalSupply', []);
    }
  }
  const reservesResult = await multi.execute();
  for (let i = 0; i < poolLength; i++) {
    const pool = pools[i];
    if (pool.lpToken.lpAddress === SFI) {
      pool.lpToken.sfiReserve = reservesResult.reserves[i];
    } else {
      let sfiReserve = BigNumber.from(0);
      if (
        reservesResult.token0[i] === SFI ||
        reservesResult.token1[i] === SFI
      ) {
        sfiReserve =
          reservesResult.token0[i] === SFI
            ? reservesResult.reserves[i]._reserve0
            : reservesResult.reserves[i]._reserve1;
      }
      pool.lpToken.token0 = reservesResult.token0[i];
      pool.lpToken.token1 = reservesResult.token1[i];
      pool.lpToken.sfiReserve = sfiReserve;
    }
    pool.lpToken.totalSupply = reservesResult.supply[i];
  }

  // ====== retrieve user info for each pool ============
  addresses.forEach((address) => {
    pools.forEach((pool) =>
      multi.call(`userInfo.${address}[${pool.id.toNumber()}]`, SAFF_STAKING_V2, 'userInfo', [pool.id, address])
    );
  });
  const userInfoResult = await multi.execute();

  // =========== Calculate voting power for each user account ==========
  const result = new Map<string, BigNumberish>();

  addresses.forEach((address) => {
    let total = BigNumber.from(0);
    pools.forEach((pool) => {
      const userInfo = userInfoResult.userInfo[`${address}`][pool.id.toNumber()];
      const poolTotal = userInfo.amount
        .mul(tenTo18)
        .mul(pools[pool.id.toNumber()].lpToken.sfiReserve)
        .div(pools[pool.id.toNumber()].lpToken.totalSupply)
        .div(tenTo18);
      total = total.add(poolTotal);
    });
    result.set(address, total);
  });

  const formatted = new Map<string, number>();
  const votingMultiplier = 'multiplier' in options ? options.multiplier : STAKING_VOTE_BOOST_DEFAULT;
  result.forEach((balance, address) => {
    const rawVote = parseFloat(formatUnits(balance, options.decimals));
    const calculatedVote = rawVote * votingMultiplier;
    formatted.set(address, calculatedVote);
  });

  return Object.fromEntries(formatted);
}

// ============ Needed contract ABI ============
const abi = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'balanceOf',
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
    stateMutability: 'view',
    type: 'function',
    constant: true
  },
  {
    inputs: [],
    name: 'poolLength',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    name: 'poolInfo',
    outputs: [
      { internalType: 'contract IERC20', name: 'lpToken', type: 'address' },
      { internalType: 'uint256', name: 'allocPoint', type: 'uint256' },
      { internalType: 'uint256', name: 'lastRewardBlock', type: 'uint256' },
      { internalType: 'uint256', name: 'accSFIPerShare', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: "token0",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "token1",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      },
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    name: "userInfo",
    outputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "rewardDebt",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
];
