import { multicall } from '../../utils';
const bignumber_1 = require('@ethersproject/bignumber');
const bn = (num) => {
  return bignumber_1.BigNumber.from(num.toString());
};

export const author = 'onigiri-x';
export const version = '0.1.0';

const abiStaking = [
  'function getStakedBalance(address _user) external view returns (uint256)'
];

const STAKING_ADDRESS = '0xF795c2abB0E7A56A0C011993C37A51626756B4BD';
export const ETH_IN_WEI = 1000000000000000000;

export async function strategy(
  _space,
  network,
  _provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const stakeResponse = await multicall(
    network,
    _provider,
    abiStaking,
    addresses.map((address: any) => [
      STAKING_ADDRESS.toLowerCase(),
      'getStakedBalance',
      [address]
    ]),
    { blockTag }
  );

  // The score is LP staking contract uniswap MONA value * (user LP staked / total LP staked)
  return Object.fromEntries(
    stakeResponse.map((value, i) => [
      addresses[i],
      parseFloat(bn(value)) / ETH_IN_WEI
    ])
  );
}
