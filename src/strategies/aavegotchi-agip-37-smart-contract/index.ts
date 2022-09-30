import { multicall } from '../../utils';

export const author = 'programmablewealth';
export const version = '0.0.1';

const contractAbi = [
  `function agip37VotingPower(address _account) public view returns (
    uint256 amGHSTBalance,
    uint256[2] unstakedWapGHST,
    uint256[2] stakedWapGHST,
    uint256 stakedGHSTFUDInfo,
    uint256 stakedGHSTFOMOInfo,
    uint256 stakedGHSTALPHAInfo,
    uint256 stakedGHSTKEKInfo,
    uint256 stakedGHSTUSDCInfo,
    uint256 stakedGHSTWMATICInfo,
    uint256 stakedGHSTGLTRInfo,
    uint256 unstakedGHSTFUDInfo,
    uint256 unstakedGHSTFOMOInfo,
    uint256 unstakedGHSTALPHAInfo,
    uint256 unstakedGHSTKEKInfo,
    uint256 unstakedGHSTGLTRInfo
  )`,
  `function lpTokensInfo() public view returns (
    uint256[2] GHSTFUDLPInfo,
    uint256[2] GHSTFOMOLPInfo,
    uint256[2] GHSTALPHALPInfo,
    uint256[2] GHSTKEKLPInfo,
    uint256[2] GHSTUSDCLPInfo,
    uint256[2] GHSTWMATICLPInfo,
    uint256[2] GHSTGLTRLPInfo
  )`
];

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  options.votingPowerAddress = options.votingPowerAddress || '0x4A642C39564605A67A616ae583ad01797630c815';
 
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const stakeQuery = addresses.map((address: string) => [
    options.votingPowerAddress,
    'agip37VotingPower',
    [address]
  ]);

  let slicedStakedQueries:any = [stakeQuery];
  if (stakeQuery.length > 1) {
    let middle = stakeQuery.length/2;
    slicedStakedQueries = [
      stakeQuery.slice(0, middle),
      stakeQuery.slice(middle, stakeQuery.length)
    ];
  }

  let lp_res = await multicall(
    network,
    provider,
    contractAbi,
    [
      [options.votingPowerAddress, 'lpTokensInfo', []]
    ],
    { blockTag }
  );

  const tokensPerUni = (balanceInUni: number, totalSupply: number) => {
    return balanceInUni / 1e18 / (totalSupply / 1e18);
  };

  let lpTokensPerUni = {
    ghstFudLp: tokensPerUni(lp_res[0].GHSTFUDLPInfo[1], lp_res[0].GHSTFUDLPInfo[0]),
    ghstFomoLp: tokensPerUni(lp_res[0].GHSTFOMOLPInfo[1], lp_res[0].GHSTFOMOLPInfo[0]),
    ghstAlphaLp: tokensPerUni(lp_res[0].GHSTALPHALPInfo[1], lp_res[0].GHSTALPHALPInfo[0]),
    ghstKekLp: tokensPerUni(lp_res[0].GHSTKEKLPInfo[1], lp_res[0].GHSTKEKLPInfo[0]),
    ghstGltrLp: tokensPerUni(lp_res[0].GHSTGLTRLPInfo[1], lp_res[0].GHSTGLTRLPInfo[0]),
    ghstUsdcLp: tokensPerUni(lp_res[0].GHSTUSDCLPInfo[1], lp_res[0].GHSTUSDCLPInfo[0]),
    ghstWmaticLp: tokensPerUni(lp_res[0].GHSTWMATICLPInfo[1], lp_res[0].GHSTWMATICLPInfo[0]),
  };

  let res = await multicall(
    network,
    provider,
    contractAbi,
    [
      ...slicedStakedQueries[0],
    ],
    { blockTag }
  );

  if (slicedStakedQueries.length > 1) {
    const res2 = await multicall(
      network,
      provider,
      contractAbi,
      [
        ...slicedStakedQueries[1]
      ],
      { blockTag }
    );

    res = [...res, ...res2];
  }

  let entries = {};
  for (let addressIndex = 0; addressIndex < addresses.length; addressIndex++) {
    let tokens = {
      staked: {
        wapGHST: Number(res[addressIndex].stakedWapGHST[0].toString()) / 1e18, 
        ghstFudLp: Number(res[addressIndex].stakedGHSTFUDInfo.toString()) / 1e18,
        ghstFomoLp: Number(res[addressIndex].stakedGHSTFOMOInfo.toString()) / 1e18,
        ghstAlphaLp: Number(res[addressIndex].stakedGHSTALPHAInfo.toString()) / 1e18,
        ghstKekLp: Number(res[addressIndex].stakedGHSTKEKInfo.toString()) / 1e18,
        ghstGltrLp: Number(res[addressIndex].stakedGHSTGLTRInfo.toString()) / 1e18,
        ghstUsdcLp: Number(res[addressIndex].stakedGHSTUSDCInfo.toString()) / 1e18,
        ghstWmaticLp: Number(res[addressIndex].stakedGHSTWMATICInfo.toString()) / 1e18,
      },
      unstaked: { 
        amGHST: Number(res[addressIndex].amGHSTBalance.toString()) / 1e18,                   
        wapGHST: Number(res[addressIndex].unstakedWapGHST[0].toString()) / 1e18,
        ghstFudLp: Number(res[addressIndex].unstakedGHSTFUDInfo.toString()) / 1e18,
        ghstFomoLp: Number(res[addressIndex].unstakedGHSTFOMOInfo.toString()) / 1e18,
        ghstAlphaLp: Number(res[addressIndex].unstakedGHSTALPHAInfo.toString()) / 1e18,
        ghstKekLp: Number(res[addressIndex].unstakedGHSTKEKInfo.toString()) / 1e18,
        ghstGltrLp: Number(res[addressIndex].unstakedGHSTGLTRInfo.toString()) / 1e18
      }
    };

    let votingPower = {
      staked: {
        wapGHST: Number(res[addressIndex].stakedWapGHST[1].toString()) / 1e18,
        ghstFudLp: tokens.staked.ghstFudLp * lpTokensPerUni.ghstFudLp,
        ghstFomoLp: tokens.staked.ghstFomoLp * lpTokensPerUni.ghstFomoLp,
        ghstAlphaLp: tokens.staked.ghstAlphaLp * lpTokensPerUni.ghstAlphaLp,
        ghstKekLp: tokens.staked.ghstKekLp * lpTokensPerUni.ghstKekLp,
        ghstGltrLp: tokens.staked.ghstGltrLp * lpTokensPerUni.ghstGltrLp,
        ghstUsdcLp: tokens.staked.ghstUsdcLp * lpTokensPerUni.ghstUsdcLp,
        ghstWmaticLp: tokens.staked.ghstWmaticLp * lpTokensPerUni.ghstWmaticLp
      },
      unstaked: {
        amGHST: tokens.unstaked.amGHST,
        wapGHST: Number(res[addressIndex].unstakedWapGHST[1].toString()) / 1e18,
        ghstFudLp: tokens.unstaked.ghstFudLp * lpTokensPerUni.ghstFudLp,
        ghstFomoLp: tokens.unstaked.ghstFomoLp * lpTokensPerUni.ghstFomoLp,
        ghstAlphaLp: tokens.unstaked.ghstAlphaLp * lpTokensPerUni.ghstAlphaLp,
        ghstKekLp: tokens.unstaked.ghstKekLp * lpTokensPerUni.ghstKekLp,
        ghstGltrLp: tokens.unstaked.ghstGltrLp * lpTokensPerUni.ghstGltrLp
      },
    };

    let totalVotingPower = 0;

    for (let k = 0; k < Object.keys(votingPower.staked).length; k++) {
      let key = Object.keys(votingPower.staked)[k];
      totalVotingPower += votingPower.staked[key];
    }

    for (let k = 0; k < Object.keys(votingPower.unstaked).length; k++) {
      let key = Object.keys(votingPower.unstaked)[k];
      totalVotingPower += votingPower.unstaked[key];
    }

    let address = addresses[addressIndex];

    // let loggedString = "TOKENS SUMMARY FOR " + address;
    // loggedString += "\nSTAKED TOKENS\n" + JSON.stringify(tokens.staked);
    // loggedString += "\nSTAKED VOTING POWER\n" + JSON.stringify(votingPower.staked);
    // loggedString += "\nUNSTAKED TOKENS\n" + JSON.stringify(tokens.unstaked);
    // loggedString += "\nUNSTAKED VOTING POWER\n" + JSON.stringify(votingPower.unstaked);
    // loggedString += "\nTOTAL VOTING POWER\n" + totalVotingPower;
    // console.log(loggedString);

    entries[address] = totalVotingPower;
  }

  return entries;
}