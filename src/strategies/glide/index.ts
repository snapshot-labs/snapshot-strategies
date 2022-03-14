import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'racollette';
export const version = '0.1.0';

const MASTERCHEF = '0x7F5489f77Bb8515DE4e0582B60Eb63A7D9959821';
const LP1_TOKEN = '0xbeeAAb15628329C2C89Bc9F403d34b31fbCb3085'; // GLIDE-ELA
const LP2_TOKEN = '0x26aCE9c9da938fb2Db91B0d0E7703861c249bf08'; // GLIDE-USDC
const GLIDE_VAULT = '0xBe224bb2EFe1aE7437Ab428557d3054E63033dA9';
const DIVIDEND_POOL = '0x80f2cF7059336b44a75F00451B81f8d742DD2b94';
const GLIDE_TOKEN = '0xd39eC832FF1CaaFAb2729c76dDeac967ABcA8F27';

const abi = [
  'function balanceOf(address) view returns (uint256 amount)',
  'function userInfo(uint256, address) view returns (uint256 amount, uint256 rewardDebt)',
  'function totalSupply() view returns (uint256)'
];

const vault_abi = [
  'function userInfo(address) view returns (uint256 shares, uint256 lastDepositedTime, uint256 glideAtLastUserAction, uint256 lastUserActionTime)',
  'function getPricePerFullShare() view returns (uint256)'
];

const dividend_abi = [
  'function userInfo(address) view returns (uint256 amount, uint256 rewardDebt)'
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
  const multi1 = new Multicaller(network, provider, abi, { blockTag });
  const multi2 = new Multicaller(network, provider, vault_abi, { blockTag });
  const multi3 = new Multicaller(network, provider, dividend_abi, { blockTag });
  const precision = BigNumber.from(10).pow(18);

  addresses.forEach((address: any) => {
    multi1.call(`glide.${address}`, GLIDE_TOKEN, 'balanceOf', [address]);
    multi1.call(`manualStaking.${address}`, MASTERCHEF, 'userInfo', [
      '0',
      address
    ]);
    multi1.call(`lp1InFarm.${address}`, MASTERCHEF, 'userInfo', ['1', address]);
    multi1.call(`lp2InFarm.${address}`, MASTERCHEF, 'userInfo', ['7', address]);
    multi1.call(`lp1.${address}`, LP1_TOKEN, 'balanceOf', [address]);
    multi1.call(`lp2.${address}`, LP2_TOKEN, 'balanceOf', [address]);
  });
  addresses.forEach((address: any) => {
    multi2.call(`autoStaking.${address}`, GLIDE_VAULT, 'userInfo', [address]);
  });
  addresses.forEach((address: any) => {
    multi3.call(`feeStaking.${address}`, DIVIDEND_POOL, 'userInfo', [address]);
  });

  multi1.call(`lp1.totalSupply`, LP1_TOKEN, 'totalSupply', []);
  multi1.call(`lp2.totalSupply`, LP2_TOKEN, 'totalSupply', []);
  multi1.call(`lp1.glide`, GLIDE_TOKEN, 'balanceOf', [LP1_TOKEN]);
  multi1.call(`lp2.glide`, GLIDE_TOKEN, 'balanceOf', [LP2_TOKEN]);
  multi2.call(`autoStaking.shares`, GLIDE_VAULT, 'getPricePerFullShare', []);

  const result1 = await multi1.execute();
  const result2 = await multi2.execute();
  const result3 = await multi3.execute();

  return Object.fromEntries(
    addresses.map((address) => [
      address,
      // GLIDE in wallet
      parseFloat(formatUnits(result1.glide[address], 18)) +
        // GLIDE-ELA LP in farm
        parseFloat(
          formatUnits(
            result1.lp1InFarm[address][0]
              .mul(result1.lp1.glide)
              .div(result1.lp1.totalSupply)
              .mul(options.lp.numerator)
              .div(options.lp.denominator),
            18
          )
        ) +
        // GLIDE-USDC LP in farm
        parseFloat(
          formatUnits(
            result1.lp2InFarm[address][0]
              .mul(result1.lp2.glide)
              .div(result1.lp2.totalSupply)
              .mul(options.lp.numerator)
              .div(options.lp.denominator),
            18
          )
        ) +
        // GLIDE-ELA LP in wallet
        parseFloat(
          formatUnits(
            result1.lp1[address]
              .mul(result1.lp1.glide)
              .div(result1.lp1.totalSupply)
              .mul(options.lp.numerator)
              .div(options.lp.denominator),
            18
          )
        ) +
        // GLIDE-USDC LP in wallet
        parseFloat(
          formatUnits(
            result1.lp2[address]
              .mul(result1.lp2.glide)
              .div(result1.lp2.totalSupply)
              .mul(options.lp.numerator)
              .div(options.lp.denominator),
            18
          )
        ) +
        // GLIDE in manual staking
        parseFloat(formatUnits(result1.manualStaking[address][0], 18)) +
        // GLIDE in auto staking
        parseFloat(
          formatUnits(
            result2.autoStaking[address][0]
              .mul(result2.autoStaking.shares)
              .div(precision)
          )
        ) +
        // GLIDE in fee staking
        parseFloat(formatUnits(result3.feeStaking[address][0], 18))
    ])
  );
}
