import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'gamiumworld';
export const version = '0.1.0';

const tokenAbi = [
  'function balanceOf(address _owner) view returns (uint256 balance)'
];
const stakingAbi = [
  'function totalStakeTokenDeposited(address user) view returns (uint256)'
];
const liquidityPoolAbi = [
  'function getReserves() view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)',
  'function totalSupply() view returns (uint256)'
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

  options.token = options.token || '0x5B6bf0c7f989dE824677cFBD507D9635965e9cD3';
  options.lp_token =
    options.lp_token || '0xEdeec0ED10Abee9b5616bE220540CAb40C9d991E';
  options.staking_token =
    options.staking_token || '0x8a3FB54dE0df64915FD66B55e1594141C1A880AB';
  options.staking_pair =
    options.staking_pair || '0xaD0916e7Ba7100629EAe9143e035F98ab5EA4ABd';
  options.symbol = options.symbol || 'GMM';
  options.decimals = options.decimals || 18;

  const liquidityPoolMulticaller = new Multicaller(
    network,
    provider,
    liquidityPoolAbi,
    { blockTag }
  );

  liquidityPoolMulticaller.call(
    'lpTotalSupply',
    options.lp_token,
    'totalSupply'
  );
  liquidityPoolMulticaller.call('lpReserves', options.lp_token, 'getReserves');

  const { lpTotalSupply, lpReserves } =
    await liquidityPoolMulticaller.execute();

  const liquidityPoolTokenRatio =
    parseFloat(formatUnits(lpReserves[0], options.decimals)) /
    parseFloat(formatUnits(lpTotalSupply, options.decimals));

  const tokenMulticaller = new Multicaller(network, provider, tokenAbi, {
    blockTag
  });
  const stakingTokenMulticaller = new Multicaller(
    network,
    provider,
    stakingAbi,
    { blockTag }
  );
  const stakingPairMulticaller = new Multicaller(
    network,
    provider,
    stakingAbi,
    { blockTag }
  );

  addresses.forEach((address) => {
    stakingPairMulticaller.call(
      address,
      options.staking_pair,
      'totalStakeTokenDeposited',
      [address]
    );
    stakingTokenMulticaller.call(
      address,
      options.staking_token,
      'totalStakeTokenDeposited',
      [address]
    );
    tokenMulticaller.call(address, options.token, 'balanceOf', [address]);
  });

  const [stakingPairResponse, stakingTokenResponse, tokenResponse]: [
    Record<string, BigNumberish>,
    Record<string, BigNumberish>,
    Record<string, BigNumberish>
  ] = await Promise.all([
    stakingPairMulticaller.execute(),
    stakingTokenMulticaller.execute(),
    tokenMulticaller.execute()
  ]);

  return Object.fromEntries(
    addresses.map((address) => {
      const tokenBalance = parseFloat(
        formatUnits(tokenResponse[address], options.decimals)
      );
      const stakingTokenBalance = parseFloat(
        formatUnits(stakingTokenResponse[address], options.decimals)
      );
      const stakingPairBalance =
        parseFloat(
          formatUnits(stakingPairResponse[address], options.decimals)
        ) *
        (1 + liquidityPoolTokenRatio);
      return [
        address,
        tokenBalance + 2 * stakingTokenBalance + 2 * stakingPairBalance
      ];
    })
  );
}
