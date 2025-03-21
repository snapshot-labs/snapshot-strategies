import { multicall } from '../../utils';

export const author = 'candoizo';
export const version = '0.1.1';

const tokenAbi = [
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function stakedInCurrentEpoch(address _account) view returns (tuple(address poolAddress, string poolName, string poolUrl, uint256 rate, uint256 amount)[] _staked)',
  'function staked(address _account) view returns (uint256 ghst_, uint256 poolTokens_, uint256 ghstUsdcPoolToken_)'
];

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  options.ghstQuickAddress =
    options.ghstQuickAddress || '0x8b1fd78ad67c7da09b682c5392b65ca7caa101b9';

  options.ghstUsdcAddress =
    options.ghstUsdcAddress || '0x096c5ccb33cfc5732bcd1f3195c13dbefc4c82f4';

  options.ghstWethAddress =
    options.ghstWethAddress || '0xccb9d2100037f1253e6c1682adf7dc9944498aff';

  options.ghstWmaticAddress =
    options.ghstWmaticAddress || '0xf69e93771F11AECd8E554aA165C3Fe7fd811530c';

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const blockAfterStakingUpgrade = 22007789;
  const afterStakingUpgrade =
    blockTag === 'latest' || blockAfterStakingUpgrade < blockTag;
  const stakeFunctionName = afterStakingUpgrade
    ? 'stakedInCurrentEpoch'
    : 'staked';
  const stakeQuery = addresses.map((address: string) => [
    options.stakingAddress,
    stakeFunctionName,
    [address]
  ]);

  const res = await multicall(
    network,
    provider,
    tokenAbi,
    [
      [options.ghstQuickAddress, 'totalSupply', []],
      [options.tokenAddress, 'balanceOf', [options.ghstQuickAddress]],
      [options.ghstUsdcAddress, 'totalSupply', []],
      [options.tokenAddress, 'balanceOf', [options.ghstUsdcAddress]],
      [options.ghstWethAddress, 'totalSupply', []],
      [options.tokenAddress, 'balanceOf', [options.ghstWethAddress]],
      [options.ghstWmaticAddress, 'totalSupply', []],
      [options.tokenAddress, 'balanceOf', [options.ghstWmaticAddress]],
      ...stakeQuery
    ],
    { blockTag }
  );

  const tokensPerUni = (balanceInUni: number, totalSupply: number) => {
    return balanceInUni / 1e18 / (totalSupply / 1e18);
  };

  const ghstQuickTotalSupply = res[0];
  const ghstQuickTokenBalanceInUni = res[1];
  const ghstQuickTokensPerUni = tokensPerUni(
    ghstQuickTokenBalanceInUni,
    ghstQuickTotalSupply
  );

  const ghstUsdcTotalSupply = res[2];
  const ghstUsdcTokenBalanceInUni = res[3];
  const ghstUsdcTokensPerUni = tokensPerUni(
    ghstUsdcTokenBalanceInUni,
    ghstUsdcTotalSupply
  );

  const response = res.slice(8);
  let entries;
  if (afterStakingUpgrade) {
    const ghstWethTotalSupply = res[4];
    const ghstWethTokenBalanceInUni = res[5];
    const ghstWethTokensPerUni = tokensPerUni(
      ghstWethTokenBalanceInUni,
      ghstWethTotalSupply
    );

    const ghstWmaticTotalSupply = res[6];
    const ghstWmaticTokenBalanceInUni = res[7];
    const ghstWmaticTokensPerUni = tokensPerUni(
      ghstWmaticTokenBalanceInUni,
      ghstWmaticTotalSupply
    );

    entries = response.map((userStakeInfo, i: number) => {
      const votePowerAmounts = userStakeInfo._staked.map((info) => {
        if (
          info.poolAddress.toLowerCase() === options.tokenAddress.toLowerCase()
        ) {
          return Number(info.amount.toString()) / 1e18;
        }
        if (
          info.poolAddress.toLowerCase() ===
          options.ghstQuickAddress.toLowerCase()
        ) {
          return (
            (Number(info.amount.toString()) / 1e18) * ghstQuickTokensPerUni
          );
        }
        if (
          info.poolAddress.toLowerCase() ===
          options.ghstUsdcAddress.toLowerCase()
        ) {
          return (Number(info.amount.toString()) / 1e18) * ghstUsdcTokensPerUni;
        }
        if (
          info.poolAddress.toLowerCase() ===
          options.ghstWethAddress.toLowerCase()
        ) {
          return (Number(info.amount.toString()) / 1e18) * ghstWethTokensPerUni;
        }
        if (
          info.poolAddress.toLowerCase() ===
          options.ghstWmaticAddress.toLowerCase()
        ) {
          return (
            (Number(info.amount.toString()) / 1e18) * ghstWmaticTokensPerUni
          );
        }
        return 0;
      });

      return [addresses[i], votePowerAmounts.reduce((a, b) => a + b, 0)];
    });
  } else {
    // before staking upgrade old response
    entries = response.map((values, i) => [
      addresses[i],
      values[0] / 1e18 + //ghst_
        (values[1] / 10 ** options.decimals) * ghstQuickTokensPerUni + //poolTokens_
        (values[2] / 10 ** options.decimals) * ghstUsdcTokensPerUni //ghstUsdcPoolToken_
    ]);
  }

  return Object.fromEntries(entries);
}
