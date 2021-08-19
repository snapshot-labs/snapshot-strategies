import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { strategy as erc20BalanceOf } from '../erc20-balance-of';
import { getBlockNumber } from '../../utils/web3';
import Multicaller from '../../utils/multicaller';

export const author = 'jeremyHD';
export const version = '0.3.0';

const ICECREAM_VOTING_POWER = '0xC08f48Abef36aEEabc5e707B8DC504aE946762ff';
const ICECREAM_VOTING_POWER_DEPLOY_BLOCK = 13048392;

const CREAM_VOTING_POWER = '0xb146BF59f30a54750209EF529a766D952720D0f9';
const CREAM_VOTING_POWER_DEPLOY_BLOCK = 12315028;

async function getScores(provider, addresses, options, blockTag) {
  return erc20BalanceOf(
    options.symbol,
    '1',
    provider,
    addresses,
    {
      address: options.votingPower,
      decimals: 18
    },
    blockTag
  );
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const snapshotBlock =
    typeof snapshot === 'number' ? snapshot : await getBlockNumber(provider);

  if (snapshotBlock >= ICECREAM_VOTING_POWER_DEPLOY_BLOCK) {
    options.votingPower = ICECREAM_VOTING_POWER;
    const scores = await getScores(provider, addresses, options, snapshotBlock);
    return Object.fromEntries(
      Array(addresses.length)
        .fill('')
        .map((_, i) => {
          const score = scores[addresses[i]];
          // ignore score < minimum voting amount
          if (score < options.minVote) {
            return [addresses[i], 0];
          }
          return [addresses[i], score];
        })
    );
  }

  /*
  ==================================
            Legacy methods
  ==================================
  */
  options.votingPower = CREAM_VOTING_POWER;
  options.symbol = 'CREAM';

  const snapshotBlocks: number[] = [];

  for (let i = 0; i < LEGACY_PARAMS.periods; i++) {
    const blocksPerPeriod = 80640; // 2 weeks per period, assume 15s per block
    const blockTag =
      snapshotBlock > blocksPerPeriod * i
        ? snapshotBlock - blocksPerPeriod * i
        : snapshotBlock;
    snapshotBlocks.push(blockTag);
  }

  const scores = await Promise.all([
    ...snapshotBlocks.map((blockTag) =>
      blockTag > CREAM_VOTING_POWER_DEPLOY_BLOCK
        ? getScores(provider, addresses, options, blockTag)
        : getLegacyScores(provider, addresses, options, blockTag)
    )
  ]);

  const averageScore = {};
  addresses.forEach((address) => {
    const userScore = scores
      .map((score) => score[address])
      .reduce((accumulator, score) => (accumulator += score), 0);
    averageScore[address] = userScore / LEGACY_PARAMS.periods;
  });

  return Object.fromEntries(
    Array(addresses.length)
      .fill('')
      .map((_, i) => {
        const score = averageScore[addresses[i]];
        // ignore score < minimum voting amount
        if (score < LEGACY_PARAMS.minVote) {
          return [addresses[i], 0];
        }
        return [addresses[i], score];
      })
  );
}

const ONE_E18 = parseUnits('1', 18);

const abi = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
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
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'userInfo',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'rewardDebt',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'exchangeRateStored',
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
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      }
    ],
    name: 'borrowBalanceStored',
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
  }
];

const LEGACY_PARAMS = {
  token: '0x2ba592F78dB6436527729929AAf6c908497cB200',
  symbol: 'CREAM',
  crCREAM: '0x892B14321a4FCba80669aE30Bd0cd99a7ECF6aC0',
  sushiswap: '0xf169CeA51EB51774cF107c88309717ddA20be167',
  uniswap: '0xddF9b7a31b32EBAF5c064C80900046C9e5b7C65F',
  balancer: '0x280267901C175565C64ACBD9A3c8F60705A72639',
  masterChef: '0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd',
  pid: 22,
  periods: 3,
  minVote: 1,
  pools: [
    {
      name: 'CREAM',
      address: '0x2ba592F78dB6436527729929AAf6c908497cB200'
    },
    {
      name: '1 Year',
      address: '0x780F75ad0B02afeb6039672E6a6CEDe7447a8b45'
    },
    {
      name: '2 Year',
      address: '0xBdc3372161dfd0361161e06083eE5D52a9cE7595'
    },
    {
      name: '3 Year',
      address: '0xD5586C1804D2e1795f3FBbAfB1FBB9099ee20A6c'
    },
    {
      name: '4 Year',
      address: '0xE618C25f580684770f2578FAca31fb7aCB2F5945'
    }
  ]
};

async function getLegacyScores(provider, addresses, options, blockTag) {
  const score = {};
  // Ethereum only
  const multi1 = new Multicaller('1', provider, abi, { blockTag });
  multi1.call('sushiswap.cream', LEGACY_PARAMS.token, 'balanceOf', [
    LEGACY_PARAMS.sushiswap
  ]);
  multi1.call('sushiswap.totalSupply', LEGACY_PARAMS.sushiswap, 'totalSupply');

  addresses.forEach((address) => {
    multi1.call(
      `sushiswap.${address}.balanceOf`,
      LEGACY_PARAMS.sushiswap,
      'balanceOf',
      [address]
    );
    multi1.call(
      `sushiswap.${address}.userInfo`,
      LEGACY_PARAMS.masterChef,
      'userInfo',
      [LEGACY_PARAMS.pid, address]
    );
  });

  const multi2 = new Multicaller('1', provider, abi, { blockTag });
  multi2.call('uniswap.cream', LEGACY_PARAMS.token, 'balanceOf', [
    LEGACY_PARAMS.uniswap
  ]);
  multi2.call('uniswap.totalSupply', LEGACY_PARAMS.uniswap, 'totalSupply');
  multi2.call('balancer.cream', LEGACY_PARAMS.token, 'balanceOf', [
    LEGACY_PARAMS.balancer
  ]);
  multi2.call('balancer.totalSupply', LEGACY_PARAMS.balancer, 'totalSupply');
  addresses.forEach((address) => {
    multi2.call(
      `uniswap.${address}.balanceOf`,
      LEGACY_PARAMS.uniswap,
      'balanceOf',
      [address]
    );
    multi2.call(
      `balancer.${address}.balanceOf`,
      LEGACY_PARAMS.balancer,
      'balanceOf',
      [address]
    );
  });

  const multi3 = new Multicaller('1', provider, abi, { blockTag });
  multi3.call(
    'crCREAM.exchangeRate',
    LEGACY_PARAMS.crCREAM,
    'exchangeRateStored'
  );
  addresses.forEach((address) => {
    multi3.call(
      `crCREAM.${address}.balanceOf`,
      LEGACY_PARAMS.crCREAM,
      'balanceOf',
      [address]
    );
    multi3.call(
      `crCREAM.${address}.borrow`,
      LEGACY_PARAMS.crCREAM,
      'borrowBalanceStored',
      [address]
    );
  });

  const multi4 = new Multicaller('1', provider, abi, { blockTag });
  addresses.forEach((address) => {
    LEGACY_PARAMS.pools.forEach((pool) => {
      multi4.call(`pool.${address}.${pool.name}`, pool.address, 'balanceOf', [
        address
      ]);
    });
  });

  const results = await Promise.all([
    multi1.execute(),
    multi2.execute(),
    multi3.execute(),
    multi4.execute()
  ]);

  const result = results.reduce((sumResult, partialResult) => {
    Object.entries(partialResult).forEach(([key, value]) => {
      sumResult[key] = value;
    });
    return sumResult;
  }, {});

  const creamPerSushiswapLP = parseUnits(
    result.sushiswap.cream.toString(),
    18
  ).div(result.sushiswap.totalSupply);
  const creamPerUniswapLP = parseUnits(result.uniswap.cream.toString(), 18).div(
    result.uniswap.totalSupply
  );
  const creamPerBalancerLP = parseUnits(
    result.balancer.cream.toString(),
    18
  ).div(result.balancer.totalSupply);

  addresses.forEach((address) => {
    const userScore = score[address] || BigNumber.from(0);
    const sushi = result.sushiswap[address].balanceOf
      .add(result.sushiswap[address].userInfo.amount)
      .mul(creamPerSushiswapLP)
      .div(ONE_E18);
    const uniswap = result.uniswap[address].balanceOf
      .mul(creamPerUniswapLP)
      .div(ONE_E18);
    const balancer = result.balancer[address].balanceOf
      .mul(creamPerBalancerLP)
      .div(ONE_E18);
    const crCREAM = result.crCREAM[address].balanceOf
      .mul(result.crCREAM.exchangeRate)
      .div(ONE_E18)
      .sub(result.crCREAM[address].borrow);
    const pools = Object.values(result.pool[address]).reduce(
      (accumulator: any, poolBalance: any) => {
        return accumulator.add(poolBalance);
      },
      BigNumber.from(0)
    );

    score[address] = userScore
      .add(sushi)
      .add(uniswap)
      .add(balancer)
      .add(crCREAM)
      .add(pools);
  });

  Object.keys(score).map((address) => {
    score[address] = parseFloat(formatUnits(score[address], 18));
  });
  return score;
}
