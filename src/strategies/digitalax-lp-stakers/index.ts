import { multicall } from '../../utils';
const bignumber_1 = require('@ethersproject/bignumber');
const uniswap_1 = require('../uniswap');
const bn = (num) => {
  return bignumber_1.BigNumber.from(num.toString());
};

export const author = 'onigiri-x';
export const version = '0.1.0';

const abiStaking = [
  'function getStakedBalance(address _user) external view returns (uint256)',
  'function stakedLPTotal() public view returns (uint256)'
];

const STAKING_ADDRESS = '0xA0d1345244C89b5574ba50bd6530d4EBd237e826';

export async function strategy(
  _space,
  network,
  _provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const totalPoolShares = await multicall(
    network,
    _provider,
    abiStaking,
    [[STAKING_ADDRESS.toLowerCase(), 'stakedLPTotal']],
    { blockTag }
  );

  const totalStakedLP = bn(totalPoolShares[0]);

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

  // Get just the LP MONA equivalent for just the LP Staking contract
  const uniswap = await uniswap_1.strategy(
    _space,
    network,
    _provider,
    [STAKING_ADDRESS],
    options,
    snapshot
  );

  // The score is LP staking contract uniswap MONA value * (user LP staked / total LP staked)
  return Object.fromEntries(
    stakeResponse.map((value, i) => [
      addresses[i],
      (parseFloat(bn(value)) * uniswap[STAKING_ADDRESS]) /
        parseFloat(totalStakedLP)
    ])
  );
}
