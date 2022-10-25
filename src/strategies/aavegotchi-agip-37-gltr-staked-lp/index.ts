import { multicall } from '../../utils';

export const author = 'programmablewealth';
export const version = '0.0.1';

const tokenAbi = [
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function allUserInfo(address _user) view returns (tuple(address lpToken, uint256 allocPoint, uint256 pending, uint256 userBalance, uint256 poolBalance)[] _info)',
  'function convertToAssets(uint256 shares) view returns (uint)'
];

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  options.ghstAddress =
    options.ghstAddress || '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7';

  options.gltrStakingAddress =
    options.gltrStakingAddress || '0x1fE64677Ab1397e20A1211AFae2758570fEa1B8c';

  options.amGhstAddress =
    options.amGhstAddress || '0x080b5BF8f360F624628E0fb961F4e67c9e3c7CF1';

  options.wapGhstAddress =
    options.wapGhstAddress || '0x73958d46B7aA2bc94926d8a215Fa560A5CdCA3eA';
  options.wapGhstPoolId = options.wapGhstPoolId || 0;

  options.ghstFudAddress =
    options.ghstFudAddress || '0xfec232cc6f0f3aeb2f81b2787a9bc9f6fc72ea5c';
  options.ghstFudPoolId = options.ghstFudPoolId || 1;

  options.ghstFomoAddress =
    options.ghstFomoAddress || '0x641ca8d96b01db1e14a5fba16bc1e5e508a45f2b';
  options.ghstFomoPoolId = options.ghstFomoPoolId || 2;

  options.ghstAlphaAddress =
    options.ghstAlphaAddress || '0xc765eca0ad3fd27779d36d18e32552bd7e26fd7b';
  options.ghstAlphaPoolId = options.ghstAlphaPoolId || 3;

  options.ghstKekAddress =
    options.ghstKekAddress || '0xbfad162775ebfb9988db3f24ef28ca6bc2fb92f0';
  options.ghstKekPoolId = options.ghstKekPoolId || 4;

  options.ghstUsdcAddress =
    options.ghstUsdcAddress || '0x096c5ccb33cfc5732bcd1f3195c13dbefc4c82f4';
  options.ghstUsdcPoolId = options.ghstUsdcPoolId || 5;

  options.ghstWmaticAddress =
    options.ghstWmaticAddress || '0xf69e93771F11AECd8E554aA165C3Fe7fd811530c';
  options.ghstWmaticPoolId = options.ghstWmaticPoolId || 6;

  options.ghstGltrAddress =
    options.ghstGltrAddress || '0xb0E35478a389dD20050D66a67FB761678af99678';
  options.ghstGltrPoolId = options.ghstGltrPoolId || 7;

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const stakeQuery = addresses.map((address: string) => [
    options.gltrStakingAddress,
    'allUserInfo',
    [address]
  ]);

  let slicedStakedQueries: any = [stakeQuery];
  if (stakeQuery.length > 1) {
    const middle = stakeQuery.length / 2;
    slicedStakedQueries = [
      stakeQuery.slice(0, middle),
      stakeQuery.slice(middle, stakeQuery.length)
    ];
  }

  let res = await multicall(
    network,
    provider,
    tokenAbi,
    [
      [options.ghstFudAddress, 'totalSupply', []],
      [options.ghstAddress, 'balanceOf', [options.ghstFudAddress]],
      [options.ghstFomoAddress, 'totalSupply', []],
      [options.ghstAddress, 'balanceOf', [options.ghstFomoAddress]],
      [options.ghstAlphaAddress, 'totalSupply', []],
      [options.ghstAddress, 'balanceOf', [options.ghstAlphaAddress]],
      [options.ghstKekAddress, 'totalSupply', []],
      [options.ghstAddress, 'balanceOf', [options.ghstKekAddress]],
      [options.ghstGltrAddress, 'totalSupply', []],
      [options.ghstAddress, 'balanceOf', [options.ghstGltrAddress]],
      [options.ghstUsdcAddress, 'totalSupply', []],
      [options.ghstAddress, 'balanceOf', [options.ghstUsdcAddress]],
      [options.ghstWmaticAddress, 'totalSupply', []],
      [options.ghstAddress, 'balanceOf', [options.ghstWmaticAddress]],
      ...slicedStakedQueries[0]
    ],
    { blockTag }
  );

  if (slicedStakedQueries.length > 1) {
    const res2 = await multicall(
      network,
      provider,
      tokenAbi,
      [...slicedStakedQueries[1]],
      { blockTag }
    );

    res = [...res, ...res2];
  }

  const tokensPerUni = (balanceInUni: number, totalSupply: number) => {
    return balanceInUni / 1e18 / (totalSupply / 1e18);
  };

  const lpTokensStartIndex = 0;
  const lpTokensPerUni = {
    ghstFudLp: tokensPerUni(
      res[lpTokensStartIndex + 1],
      res[lpTokensStartIndex]
    ),
    ghstFomoLp: tokensPerUni(
      res[lpTokensStartIndex + 3],
      res[lpTokensStartIndex + 2]
    ),
    ghstAlphaLp: tokensPerUni(
      res[lpTokensStartIndex + 5],
      res[lpTokensStartIndex + 4]
    ),
    ghstKekLp: tokensPerUni(
      res[lpTokensStartIndex + 7],
      res[lpTokensStartIndex + 6]
    ),
    ghstGltrLp: tokensPerUni(
      res[lpTokensStartIndex + 9],
      res[lpTokensStartIndex + 8]
    ),
    ghstUsdcLp: tokensPerUni(
      res[lpTokensStartIndex + 11],
      res[lpTokensStartIndex + 10]
    ),
    ghstWmaticLp: tokensPerUni(
      res[lpTokensStartIndex + 13],
      res[lpTokensStartIndex + 12]
    )
  };

  const entries = {};
  for (let addressIndex = 0; addressIndex < addresses.length; addressIndex++) {
    const i = addressIndex + 14;
    const tokens = {
      staked: {
        ghstFudLp:
          Number(res[i]._info[options.ghstFudPoolId].userBalance.toString()) /
          1e18,
        ghstFomoLp:
          Number(res[i]._info[options.ghstFomoPoolId].userBalance.toString()) /
          1e18,
        ghstAlphaLp:
          Number(res[i]._info[options.ghstAlphaPoolId].userBalance.toString()) /
          1e18,
        ghstKekLp:
          Number(res[i]._info[options.ghstKekPoolId].userBalance.toString()) /
          1e18,
        ghstGltrLp:
          Number(res[i]._info[options.ghstGltrPoolId].userBalance.toString()) /
          1e18,
        ghstUsdcLp:
          Number(res[i]._info[options.ghstUsdcPoolId].userBalance.toString()) /
          1e18,
        ghstWmaticLp:
          Number(
            res[i]._info[options.ghstWmaticPoolId].userBalance.toString()
          ) / 1e18
      }
    };

    const votingPower = {
      staked: {
        ghstFudLp: tokens.staked.ghstFudLp * lpTokensPerUni.ghstFudLp,
        ghstFomoLp: tokens.staked.ghstFomoLp * lpTokensPerUni.ghstFomoLp,
        ghstAlphaLp: tokens.staked.ghstAlphaLp * lpTokensPerUni.ghstAlphaLp,
        ghstKekLp: tokens.staked.ghstKekLp * lpTokensPerUni.ghstKekLp,
        ghstGltrLp: tokens.staked.ghstGltrLp * lpTokensPerUni.ghstGltrLp,
        ghstUsdcLp: tokens.staked.ghstUsdcLp * lpTokensPerUni.ghstUsdcLp,
        ghstWmaticLp: tokens.staked.ghstWmaticLp * lpTokensPerUni.ghstWmaticLp
      }
    };

    let totalVotingPower = 0;
    for (let k = 0; k < Object.keys(votingPower.staked).length; k++) {
      const key = Object.keys(votingPower.staked)[k];
      totalVotingPower += votingPower.staked[key];
    }

    const address = addresses[addressIndex];

    // let loggedString = "TOKENS SUMMARY FOR " + address;
    // loggedString += "\nSTAKED TOKENS\n" + JSON.stringify(tokens.staked);
    // loggedString += "\nSTAKED VOTING POWER\n" + JSON.stringify(votingPower.staked);
    // loggedString += "\nTOTAL VOTING POWER\n" + totalVotingPower;
    // console.log(loggedString);

    entries[address] = totalVotingPower;
  }

  return entries;
}
