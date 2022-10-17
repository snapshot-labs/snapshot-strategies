import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { strategy as erc20BalanceOf } from '../erc20-balance-of';
import { getBlockNumber } from '../../utils';
import { Multicaller } from '../../utils';

export const author = 'jeremyHD';
export const version = '0.2.1';
export const dependOnOtherAddress = false;

const ONE_E18 = parseUnits('1', 18);

const abi = [
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function userInfo(uint256, address) view returns (uint256 amount, uint256 rewardDebt)',
  'function exchangeRateStored() view returns (uint256)',
  'function borrowBalanceStored(address account) view returns (uint256)'
];

const CREAM_VOTING_POWER = '0xb146BF59f30a54750209EF529a766D952720D0f9';
const CREAM_VOTING_POWER_DEPLOY_BLOCK = 12315028;

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
  const snapshotBlocks: number[] = [];

  for (let i = 0; i < options.periods; i++) {
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
    averageScore[address] = userScore / options.periods;
  });

  return Object.fromEntries(
    Array(addresses.length)
      .fill('')
      .map((_, i) => {
        const score = averageScore[addresses[i]];
        // ignore score < minimum voting amount
        if (score < options.minVote) {
          return [addresses[i], 0];
        }
        return [addresses[i], score];
      })
  );
}

async function getScores(provider, addresses, options, blockTag) {
  return erc20BalanceOf(
    'cream',
    '1',
    provider,
    addresses,
    {
      address: CREAM_VOTING_POWER,
      decimals: 18
    },
    blockTag
  );
}

async function getLegacyScores(provider, addresses, options, blockTag) {
  const score = {};
  // Ethereum only
  const multi1 = new Multicaller('1', provider, abi, { blockTag });
  multi1.call('sushiswap.cream', options.token, 'balanceOf', [
    options.sushiswap
  ]);
  multi1.call('sushiswap.totalSupply', options.sushiswap, 'totalSupply');

  addresses.forEach((address) => {
    multi1.call(
      `sushiswap.${address}.balanceOf`,
      options.sushiswap,
      'balanceOf',
      [address]
    );
    multi1.call(
      `sushiswap.${address}.userInfo`,
      options.masterChef,
      'userInfo',
      [options.pid, address]
    );
  });

  const multi2 = new Multicaller('1', provider, abi, { blockTag });
  multi2.call('uniswap.cream', options.token, 'balanceOf', [options.uniswap]);
  multi2.call('uniswap.totalSupply', options.uniswap, 'totalSupply');
  multi2.call('balancer.cream', options.token, 'balanceOf', [options.balancer]);
  multi2.call('balancer.totalSupply', options.balancer, 'totalSupply');
  addresses.forEach((address) => {
    multi2.call(`uniswap.${address}.balanceOf`, options.uniswap, 'balanceOf', [
      address
    ]);
    multi2.call(
      `balancer.${address}.balanceOf`,
      options.balancer,
      'balanceOf',
      [address]
    );
  });

  const multi3 = new Multicaller('1', provider, abi, { blockTag });
  multi3.call('crCREAM.exchangeRate', options.crCREAM, 'exchangeRateStored');
  addresses.forEach((address) => {
    multi3.call(`crCREAM.${address}.balanceOf`, options.crCREAM, 'balanceOf', [
      address
    ]);
    multi3.call(
      `crCREAM.${address}.borrow`,
      options.crCREAM,
      'borrowBalanceStored',
      [address]
    );
  });

  const multi4 = new Multicaller('1', provider, abi, { blockTag });
  addresses.forEach((address) => {
    options.pools.forEach((pool) => {
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
