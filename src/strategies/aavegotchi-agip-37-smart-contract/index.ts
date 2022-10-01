import { multicall } from '../../utils';

export const author = 'programmablewealth';
export const version = '0.0.1';

const contractAbi = [
  `function agip37VotingPowerSummary(address _account) public view returns (
    tuple(
      uint256 amGHSTVP,
      uint256 unstakedWapGHSTVP,
      uint256 stakedWapGHSTVP,
      uint256 stakedGHSTLPTokensVP,
      uint256 unstakedGHSTLPTokensVP
    )
  )`,
  `function agip37VotingPowerNumber(address _account) public view returns (uint256 votingPower)`,
  'function balanceOf(address account) view returns (uint256)',
  'function gltrAllUnstakedLPTokenVotingPower(address _account) public view returns (uint256)',
  'function batchAgip37VotingPower(address[] memory _accounts) public view returns (uint256[] memory)'
];

// const contractAbi = [
//   `function agip37VotingPower(address _account) public view returns (
//     uint256 amGHSTBalance,
//     uint256[2] unstakedWapGHST,
//     uint256[2] stakedWapGHST,
//     uint256 stakedGHSTFUDInfo,
//     uint256 stakedGHSTFOMOInfo,
//     uint256 stakedGHSTALPHAInfo,
//     uint256 stakedGHSTKEKInfo,
//     uint256 stakedGHSTUSDCInfo,
//     uint256 stakedGHSTWMATICInfo,
//     uint256 stakedGHSTGLTRInfo,
//     uint256 unstakedGHSTFUDInfo,
//     uint256 unstakedGHSTFOMOInfo,
//     uint256 unstakedGHSTALPHAInfo,
//     uint256 unstakedGHSTKEKInfo,
//     uint256 unstakedGHSTGLTRInfo
//   )`,
//   `function lpTokensInfo() public view returns (
//     uint256[2] GHSTFUDLPInfo,
//     uint256[2] GHSTFOMOLPInfo,
//     uint256[2] GHSTALPHALPInfo,
//     uint256[2] GHSTKEKLPInfo,
//     uint256[2] GHSTUSDCLPInfo,
//     uint256[2] GHSTWMATICLPInfo,
//     uint256[2] GHSTGLTRLPInfo
//   )`,
//   `function gltrStakedWAPGHSTVotingPower(address _account) public view returns (uint256[2] memory)`,
//   `function gltrAllUnstakedLPTokenVotingPower(address _account) public view returns (uint256[5] memory)`,
//   `function gltrAllStakedLPTokenVotingPower(address _account) public view returns (uint256[7] memory)`
// ];

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  options.votingPowerAddress = options.votingPowerAddress || '0x66054Cd5b64fc1Fc0330DD711a7956e468f97933';
 
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // const stakeQuery = addresses.map((address: string) => [
  //   options.votingPowerAddress,
  //   'agip37VotingPower',
  //   [address]
  // ]);

  // const stakeQuery = addresses.map((address: string) => [
  //   "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
  //   'balanceOf',
  //   [address]
  // ]);

  // const stakeQuery = addresses.map((address: string) => [
  //   options.votingPowerAddress,
  //   'agip37VotingPowerSummary',
  //   [address]
  // ]);

  const stakeQuery = addresses.map((address: string) => [
    options.votingPowerAddress,
    'agip37VotingPowerNumber',
    [address]
  ]);

  // const stakeQuery = [
  //   [ options.votingPowerAddress, 'batchAgip37VotingPower', [ addresses.slice(0, 40) ] ],
  //   [ options.votingPowerAddress, 'batchAgip37VotingPower', [ addresses.slice(40, 80) ] ]
  // ];

  let slicedStakedQueries:any = [stakeQuery];
  if (stakeQuery.length > 1) {
    let middle = stakeQuery.length/2;
    slicedStakedQueries = [
      stakeQuery.slice(0, middle),
      stakeQuery.slice(middle, stakeQuery.length)
    ];

    // slicedStakedQueries = [
    //   stakeQuery.slice(0, 100),
    //   stakeQuery.slice(100, 200),
    //   stakeQuery.slice(100, 300),
    //   stakeQuery.slice(100, 400),
    //   stakeQuery.slice(100, stakeQuery.length),
    // ];
  }

  // let res = await multicall(
  //   network,
  //   provider,
  //   contractAbi,
  //   [
  //     ...stakeQuery,
  //   ],
  //   { blockTag }
  // );

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

    // const res3 = await multicall(
    //   network,
    //   provider,
    //   contractAbi,
    //   [
    //     ...slicedStakedQueries[2]
    //   ],
    //   { blockTag }
    // );

    // const res4 = await multicall(
    //   network,
    //   provider,
    //   contractAbi,
    //   [
    //     ...slicedStakedQueries[3]
    //   ],
    //   { blockTag }
    // );

    // const res5 = await multicall(
    //   network,
    //   provider,
    //   contractAbi,
    //   [
    //     ...slicedStakedQueries[4]
    //   ],
    //   { blockTag }
    // );

    res = [...res, ...res2 ];
    // res = [...res, ...res2, ...res3, ...res4, ...res5];
  }

  console.log(res);

  let entries = {};
  for (let addressIndex = 0; addressIndex < addresses.length; addressIndex++) {
    let totalVotingPower = Number(res[addressIndex].votingPower.toString()) / 1e18;
    let address = addresses[addressIndex];

    // let loggedString = "TOKENS SUMMARY FOR " + address;
    // // loggedString += "\nSTAKED TOKENS\n" + JSON.stringify(tokens.staked);
    // loggedString += "\nSTAKED VOTING POWER\n" + JSON.stringify(votingPower.staked);
    // // loggedString += "\nUNSTAKED TOKENS\n" + JSON.stringify(tokens.unstaked);
    // loggedString += "\nUNSTAKED VOTING POWER\n" + JSON.stringify(votingPower.unstaked);
    // loggedString += "\nTOTAL VOTING POWER\n" + totalVotingPower;
    // console.log(loggedString);

    entries[address] = totalVotingPower;
  }

  console.log(entries);

  return entries;
}