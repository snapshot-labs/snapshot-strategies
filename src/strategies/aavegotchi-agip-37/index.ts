import { multicall } from '../../utils';

export const author = 'jarrod';
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
  options.ghstAddress = options.ghstAddress || '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7';

  options.gltrStakingAddress = options.gltrStakingAddress || '0x1fE64677Ab1397e20A1211AFae2758570fEa1B8c';
  
  options.amGhstAddress = options.amGhstAddress || '0x080b5BF8f360F624628E0fb961F4e67c9e3c7CF1';

  options.wapGhstAddress = options.wapGhstAddress || '0x73958d46B7aA2bc94926d8a215Fa560A5CdCA3eA';
  options.wapGhstPoolId = options.wapGhstPoolId || 0;
  
  options.ghstFudAddress = options.ghstFudAddress || '0xfec232cc6f0f3aeb2f81b2787a9bc9f6fc72ea5c';
  options.ghstFudPoolId = options.ghstFudPoolId || 1;
  
  options.ghstFomoAddress = options.ghstFomoAddress || '0x641ca8d96b01db1e14a5fba16bc1e5e508a45f2b';
  options.ghstFomoPoolId = options.ghstFomoPoolId || 2;
  
  options.ghstAlphaAddress = options.ghstAlphaAddress || '0xc765eca0ad3fd27779d36d18e32552bd7e26fd7b';
  options.ghstAlphaPoolId = options.ghstAlphaPoolId || 3;
  
  options.ghstKekAddress = options.ghstKekAddress || '0xbfad162775ebfb9988db3f24ef28ca6bc2fb92f0';
  options.ghstKekPoolId = options.ghstKekPoolId || 4;
  
  options.ghstGltrAddress = options.ghstGltrAddress || '0xb0E35478a389dD20050D66a67FB761678af99678';
  options.ghstGltrPoolId = options.ghstGltrPoolId || 7;
  
  options.ghstUsdcAddress =
    options.ghstUsdcAddress || '0x096c5ccb33cfc5732bcd1f3195c13dbefc4c82f4';
  options.ghstUsdcPoolId = options.ghstUsdcPoolId || 5;

  options.ghstWmaticAddress =
    options.ghstWmaticAddress || '0xf69e93771F11AECd8E554aA165C3Fe7fd811530c';
  options.ghstWmaticPoolId = options.ghstWmaticPoolId || 6;

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  let unstakedQueries:any = [];
  addresses.map((address: string) => {
    // unstakedQueries.push([
    //   [options.amGhstAddress, 'balanceOf', [address]],
    //   [options.wapGhstAddress, 'balanceOf', [address]],
    //   [options.ghstFudAddress, 'balanceOf', [address]],
    //   [options.ghstFomoAddress, 'balanceOf', [address]],
    //   [options.ghstAlphaAddress, 'balanceOf', [address]],
    //   [options.ghstKekAddress, 'balanceOf', [address]],
    //   [options.ghstGltrAddress, 'balanceOf', [address]]
    // ]);
    unstakedQueries.push([options.amGhstAddress, 'balanceOf', [address]]);
    unstakedQueries.push([options.wapGhstAddress, 'balanceOf', [address]]);
    unstakedQueries.push([options.ghstFudAddress, 'balanceOf', [address]]);
    unstakedQueries.push([options.ghstFomoAddress, 'balanceOf', [address]]);
    unstakedQueries.push([options.ghstAlphaAddress, 'balanceOf', [address]]);
    unstakedQueries.push([options.ghstKekAddress, 'balanceOf', [address]]);
    unstakedQueries.push([options.ghstGltrAddress, 'balanceOf', [address]]);
  });

  // const unstakedWapGhstQuery = addresses.map((address: string) => [
  //   options.wapGhstAddress, 'balanceOf', [address]
  // ]);

  const stakedQuery = addresses.map((address: string) => [
    options.gltrStakingAddress,
    'allUserInfo',
    [address]
  ]);

  // retrieve the total supply numbers for the LP pairs and the balance of the GHST in each pair
  const res = await multicall(
    network,
    provider,
    tokenAbi,
    [
      // [options.ghstFudAddress, 'totalSupply', []],
      // [options.ghstAddress, 'balanceOf', [options.ghstFudAddress]],
      // [options.ghstFomoAddress, 'totalSupply', []],
      // [options.ghstAddress, 'balanceOf', [options.ghstFomoAddress]],
      // [options.ghstAlphaAddress, 'totalSupply', []],
      // [options.ghstAddress, 'balanceOf', [options.ghstAlphaAddress]],
      // [options.ghstKekAddress, 'totalSupply', []],
      // [options.ghstAddress, 'balanceOf', [options.ghstKekAddress]],
      // [options.ghstGltrAddress, 'totalSupply', []],
      // [options.ghstAddress, 'balanceOf', [options.ghstGltrAddress]],
      // [options.ghstUsdcAddress, 'totalSupply', []],
      // [options.ghstAddress, 'balanceOf', [options.ghstUsdcAddress]],
      // [options.ghstWmaticAddress, 'totalSupply', []],
      // [options.ghstAddress, 'balanceOf', [options.ghstWmaticAddress]],
      // ...unstakedQuery,
      ...stakedQuery,
      ...unstakedQueries
    ],
    { blockTag }
  );


  // unstaked WAP GHST
  let unstakedConvertedWapGHST:any = [];
  const RES_UNSTAKED_QUERIES_INDEX = 1;
  const UNSTAKED_QUERIES_WAPGHST_INDEX = 1;
  const UNSTAKED_QUERIES_RESULTS_PER_ACCOUNT = 7;

  for (let i = 0; i < addresses.length; i++) {
    const unstakedWapGHSTBalance = res[RES_UNSTAKED_QUERIES_INDEX + ((i*UNSTAKED_QUERIES_RESULTS_PER_ACCOUNT) + UNSTAKED_QUERIES_WAPGHST_INDEX)][0];
    unstakedConvertedWapGHST.push([options.wapGhstAddress, 'convertToAssets', [unstakedWapGHSTBalance]]);
  }
  console.log("unstakedConvertedWapGHST", unstakedConvertedWapGHST);

  // staked WAP GHST
  let stakedConvertedWapGHST:any = [];
  const RES_STAKED_QUERIES_INDEX = 0;
  for (let i = 0; i < addresses.length; i++) {
    const stakedWapGHSTBalance = res[RES_STAKED_QUERIES_INDEX]._info[options.wapGhstPoolId].userBalance;
    stakedConvertedWapGHST.push([options.wapGhstAddress, 'convertToAssets', [stakedWapGHSTBalance]]);
  }

  // converted wapGHST into GHST (this has a dependency on the unstaked and staked wapGHST balances retrieved in res)
  // const wapGHST_res = await multicall(
  //   network,
  //   provider,
  //   tokenAbi,
  //   [
  //     ...unstakedConvertedWapGHST,
  //     ...stakedConvertedWapGHST
  //   ],
  //   { blockTag }
  // );

  // console.log('addresses', addresses);
  res.map((r, i) => {
    if (i > addresses.length - 1) {
      console.log('res', i, Number(r.toString()) / 1e18)
    } else {
      console.log('res', i, r._info)

    }
  });

  // wapGHST_res.map((r, i) => {
  //   console.log('wapGHST_res', i, Number(r.toString()) / 1e18)
  //   // console.log(i, r)
  // });

  addresses.map((address, addressIndex) => {
    let loggedString = "TOKENS SUMMARY FOR " + address;
    loggedString += "\nSTAKED TOKENS";
    loggedString += "\nSTAKED wapGHST: " + Number(res[addressIndex]._info[options.wapGhstPoolId].userBalance.toString()) / 1e18;
    loggedString += "\nSTAKED GHST-FUD LP: " + Number(res[addressIndex]._info[options.ghstFudPoolId].userBalance.toString()) / 1e18;
    loggedString += "\nSTAKED GHST-FOMO LP: " + Number(res[addressIndex]._info[options.ghstFomoPoolId].userBalance.toString()) / 1e18;
    loggedString += "\nSTAKED GHST-ALPHA LP: " + Number(res[addressIndex]._info[options.ghstAlphaPoolId].userBalance.toString()) / 1e18;
    loggedString += "\nSTAKED GHST-KEK LP: " + Number(res[addressIndex]._info[options.ghstKekPoolId].userBalance.toString()) / 1e18;
    loggedString += "\nSTAKED GHST-GLTR LP: " + Number(res[addressIndex]._info[options.ghstGltrPoolId].userBalance.toString()) / 1e18;
    loggedString += "\nSTAKED GHST-USDC LP: " + Number(res[addressIndex]._info[options.ghstUsdcPoolId].userBalance.toString()) / 1e18;
    loggedString += "\nSTAKED GHST-WMATIC LP: " + Number(res[addressIndex]._info[options.ghstWmaticPoolId].userBalance.toString()) / 1e18;

    let i = (addressIndex * 7) + 1;
    loggedString += "\nUNSTAKED TOKENS";
    loggedString += "\nUNSTAKED amGHST: " + Number(res[i+1].toString()) / 1e18;
    loggedString += "\nUNSTAKED wapGHST: " + Number(res[i+2].toString()) / 1e18;
    loggedString += "\nUNSTAKED GHST-FUD LP: " + Number(res[i+3].toString()) / 1e18;
    loggedString += "\nUNSTAKED GHST-FOMO LP: " + Number(res[i+4].toString()) / 1e18;
    loggedString += "\nUNSTAKED GHST-ALPHA LP: " + Number(res[i+5].toString()) / 1e18;
    loggedString += "\nUNSTAKED GHST-KEK LP: " + Number(res[i+6].toString()) / 1e18;
    loggedString += "\nUNSTAKED GHST-GLTR LP: " + Number(res[i+7].toString()) / 1e18;

    console.log(loggedString);
  });

  return;

  // const blockAfterStakingUpgrade = 22007789;
  // const afterStakingUpgrade =
  //   blockTag === 'latest' || blockAfterStakingUpgrade < blockTag;
  // const stakeFunctionName = afterStakingUpgrade
  //   ? 'stakedInCurrentEpoch'
  //   : 'staked';
  // const stakeQuery = addresses.map((address: string) => [
  //   options.stakingAddress,
  //   stakeFunctionName,
  //   [address]
  // ]);

  // const res = await multicall(
  //   network,
  //   provider,
  //   tokenAbi,
  //   [
  //     [options.ghstQuickAddress, 'totalSupply', []],
  //     [options.tokenAddress, 'balanceOf', [options.ghstQuickAddress]],
  //     [options.ghstUsdcAddress, 'totalSupply', []],
  //     [options.tokenAddress, 'balanceOf', [options.ghstUsdcAddress]],
  //     [options.ghstWethAddress, 'totalSupply', []],
  //     [options.tokenAddress, 'balanceOf', [options.ghstWethAddress]],
  //     [options.ghstWmaticAddress, 'totalSupply', []],
  //     [options.tokenAddress, 'balanceOf', [options.ghstWmaticAddress]],
  //     ...stakeQuery
  //   ],
  //   { blockTag }
  // );

  // const tokensPerUni = (balanceInUni: number, totalSupply: number) => {
  //   return balanceInUni / 1e18 / (totalSupply / 1e18);
  // };

  // const ghstQuickTotalSupply = res[0];
  // const ghstQuickTokenBalanceInUni = res[1];
  // const ghstQuickTokensPerUni = tokensPerUni(
  //   ghstQuickTokenBalanceInUni,
  //   ghstQuickTotalSupply
  // );

  // const ghstUsdcTotalSupply = res[2];
  // const ghstUsdcTokenBalanceInUni = res[3];
  // const ghstUsdcTokensPerUni = tokensPerUni(
  //   ghstUsdcTokenBalanceInUni,
  //   ghstUsdcTotalSupply
  // );

  // const response = res.slice(8);
  // let entries;
  // if (afterStakingUpgrade) {
  //   const ghstWethTotalSupply = res[4];
  //   const ghstWethTokenBalanceInUni = res[5];
  //   const ghstWethTokensPerUni = tokensPerUni(
  //     ghstWethTokenBalanceInUni,
  //     ghstWethTotalSupply
  //   );

  //   const ghstWmaticTotalSupply = res[6];
  //   const ghstWmaticTokenBalanceInUni = res[7];
  //   const ghstWmaticTokensPerUni = tokensPerUni(
  //     ghstWmaticTokenBalanceInUni,
  //     ghstWmaticTotalSupply
  //   );

  //   entries = response.map((userStakeInfo, i: number) => {
  //     const votePowerAmounts = userStakeInfo._staked.map((info) => {
  //       if (
  //         info.poolAddress.toLowerCase() === options.tokenAddress.toLowerCase()
  //       ) {
  //         return Number(info.amount.toString()) / 1e18;
  //       }
  //       if (
  //         info.poolAddress.toLowerCase() ===
  //         options.ghstQuickAddress.toLowerCase()
  //       ) {
  //         return (
  //           (Number(info.amount.toString()) / 1e18) * ghstQuickTokensPerUni
  //         );
  //       }
  //       if (
  //         info.poolAddress.toLowerCase() ===
  //         options.ghstUsdcAddress.toLowerCase()
  //       ) {
  //         return (Number(info.amount.toString()) / 1e18) * ghstUsdcTokensPerUni;
  //       }
  //       if (
  //         info.poolAddress.toLowerCase() ===
  //         options.ghstWethAddress.toLowerCase()
  //       ) {
  //         return (Number(info.amount.toString()) / 1e18) * ghstWethTokensPerUni;
  //       }
  //       if (
  //         info.poolAddress.toLowerCase() ===
  //         options.ghstWmaticAddress.toLowerCase()
  //       ) {
  //         return (
  //           (Number(info.amount.toString()) / 1e18) * ghstWmaticTokensPerUni
  //         );
  //       }
  //       return 0;
  //     });

  //     return [addresses[i], votePowerAmounts.reduce((a, b) => a + b, 0)];
  //   });
  // } else {
  //   // before staking upgrade old response
  //   entries = response.map((values, i) => [
  //     addresses[i],
  //     values[0] / 1e18 + //ghst_
  //       (values[1] / 10 ** options.decimals) * ghstQuickTokensPerUni + //poolTokens_
  //       (values[2] / 10 ** options.decimals) * ghstUsdcTokensPerUni //ghstUsdcPoolToken_
  //   ]);
  // }
  
  // return Object.fromEntries(entries);
}


// const tokenAbi = [
//   'function balanceOf(address account) view returns (uint256)',
//   'function totalSupply() view returns (uint256)',
//   'function stakedInCurrentEpoch(address _account) view returns (tuple(address poolAddress, string poolName, string poolUrl, uint256 rate, uint256 amount)[] _staked)',
//   'function staked(address _account) view returns (uint256 ghst_, uint256 poolTokens_, uint256 ghstUsdcPoolToken_)'
// ];

// export async function strategy(
//   _space,
//   network,
//   provider,
//   addresses,
//   options,
//   snapshot
// ) {
//   options.ghstQuickAddress =
//     options.ghstQuickAddress || '0x8b1fd78ad67c7da09b682c5392b65ca7caa101b9';

//   options.ghstUsdcAddress =
//     options.ghstUsdcAddress || '0x096c5ccb33cfc5732bcd1f3195c13dbefc4c82f4';

//   options.ghstWethAddress =
//     options.ghstWethAddress || '0xccb9d2100037f1253e6c1682adf7dc9944498aff';

//   options.ghstWmaticAddress =
//     options.ghstWmaticAddress || '0xf69e93771F11AECd8E554aA165C3Fe7fd811530c';

//   const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

//   const blockAfterStakingUpgrade = 22007789;
//   const afterStakingUpgrade =
//     blockTag === 'latest' || blockAfterStakingUpgrade < blockTag;
//   const stakeFunctionName = afterStakingUpgrade
//     ? 'stakedInCurrentEpoch'
//     : 'staked';
//   const stakeQuery = addresses.map((address: string) => [
//     options.stakingAddress,
//     stakeFunctionName,
//     [address]
//   ]);

//   const res = await multicall(
//     network,
//     provider,
//     tokenAbi,
//     [
//       [options.ghstQuickAddress, 'totalSupply', []],
//       [options.tokenAddress, 'balanceOf', [options.ghstQuickAddress]],
//       [options.ghstUsdcAddress, 'totalSupply', []],
//       [options.tokenAddress, 'balanceOf', [options.ghstUsdcAddress]],
//       [options.ghstWethAddress, 'totalSupply', []],
//       [options.tokenAddress, 'balanceOf', [options.ghstWethAddress]],
//       [options.ghstWmaticAddress, 'totalSupply', []],
//       [options.tokenAddress, 'balanceOf', [options.ghstWmaticAddress]],
//       ...stakeQuery
//     ],
//     { blockTag }
//   );

//   const tokensPerUni = (balanceInUni: number, totalSupply: number) => {
//     return balanceInUni / 1e18 / (totalSupply / 1e18);
//   };

//   const ghstQuickTotalSupply = res[0];
//   const ghstQuickTokenBalanceInUni = res[1];
//   const ghstQuickTokensPerUni = tokensPerUni(
//     ghstQuickTokenBalanceInUni,
//     ghstQuickTotalSupply
//   );

//   const ghstUsdcTotalSupply = res[2];
//   const ghstUsdcTokenBalanceInUni = res[3];
//   const ghstUsdcTokensPerUni = tokensPerUni(
//     ghstUsdcTokenBalanceInUni,
//     ghstUsdcTotalSupply
//   );

//   const response = res.slice(8);
//   let entries;
//   if (afterStakingUpgrade) {
//     const ghstWethTotalSupply = res[4];
//     const ghstWethTokenBalanceInUni = res[5];
//     const ghstWethTokensPerUni = tokensPerUni(
//       ghstWethTokenBalanceInUni,
//       ghstWethTotalSupply
//     );

//     const ghstWmaticTotalSupply = res[6];
//     const ghstWmaticTokenBalanceInUni = res[7];
//     const ghstWmaticTokensPerUni = tokensPerUni(
//       ghstWmaticTokenBalanceInUni,
//       ghstWmaticTotalSupply
//     );

//     entries = response.map((userStakeInfo, i: number) => {
//       const votePowerAmounts = userStakeInfo._staked.map((info) => {
//         if (
//           info.poolAddress.toLowerCase() === options.tokenAddress.toLowerCase()
//         ) {
//           return Number(info.amount.toString()) / 1e18;
//         }
//         if (
//           info.poolAddress.toLowerCase() ===
//           options.ghstQuickAddress.toLowerCase()
//         ) {
//           return (
//             (Number(info.amount.toString()) / 1e18) * ghstQuickTokensPerUni
//           );
//         }
//         if (
//           info.poolAddress.toLowerCase() ===
//           options.ghstUsdcAddress.toLowerCase()
//         ) {
//           return (Number(info.amount.toString()) / 1e18) * ghstUsdcTokensPerUni;
//         }
//         if (
//           info.poolAddress.toLowerCase() ===
//           options.ghstWethAddress.toLowerCase()
//         ) {
//           return (Number(info.amount.toString()) / 1e18) * ghstWethTokensPerUni;
//         }
//         if (
//           info.poolAddress.toLowerCase() ===
//           options.ghstWmaticAddress.toLowerCase()
//         ) {
//           return (
//             (Number(info.amount.toString()) / 1e18) * ghstWmaticTokensPerUni
//           );
//         }
//         return 0;
//       });

//       return [addresses[i], votePowerAmounts.reduce((a, b) => a + b, 0)];
//     });
//   } else {
//     // before staking upgrade old response
//     entries = response.map((values, i) => [
//       addresses[i],
//       values[0] / 1e18 + //ghst_
//         (values[1] / 10 ** options.decimals) * ghstQuickTokensPerUni + //poolTokens_
//         (values[2] / 10 ** options.decimals) * ghstUsdcTokensPerUni //ghstUsdcPoolToken_
//     ]);
//   }

//   return Object.fromEntries(entries);
// }
