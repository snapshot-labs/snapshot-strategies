import { formatUnits } from '@ethersproject/units';
import { call, multicall } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'apescape';
export const version = '0.1.0';
export const dependOnOtherAddress = false;

const chefAbi = [
  'function userInfo(uint256, address) view returns (uint256 amount, uint256 rewardDebt)'
];
const lpPairAbi = [
  'function totalSupply() view returns (uint256)',
  'function getReserves() view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)'
];

const chef1Address = '0xCA74b3db871c679e928E70917Ae804DC7BFd8781';
const chef2Address = '0x062D9b9a97B4eFC67D286e99618dA87C614B166F';
const lpPairAddress = '0x52307F4C5CeBB1f157c3947D335B999091bAa3F7';
const decimals = 18;
const precision = BigNumber.from(10).pow(18);

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const userInfoPool1 = await multicall(
    network,
    provider,
    chefAbi,
    addresses.map((address: any) => [chef1Address, 'userInfo', [1, address]]),
    { blockTag }
  );

  const userInfoPool2 = await multicall(
    network,
    provider,
    chefAbi,
    addresses.map((address: any) => [chef2Address, 'userInfo', [0, address]]),
    { blockTag }
  );

  const lpSupply = await call(provider, lpPairAbi, [
    lpPairAddress,
    'totalSupply',
    []
  ]);
  const lpReserves = await call(provider, lpPairAbi, [
    lpPairAddress,
    'getReserves',
    []
  ]);

  return Object.fromEntries(
    userInfoPool1.map((info1, i) => {
      const balance1 = info1.amount;
      const balance2 = userInfoPool2[i].amount;

      const tokensPerLp = lpReserves._reserve1.mul(precision).div(lpSupply);
      const balance2Normalized = balance2.mul(tokensPerLp).div(precision);
      const sum = balance1.add(balance2Normalized);

      return [addresses[i], parseFloat(formatUnits(sum.toString(), decimals))];
    })
  );
}
