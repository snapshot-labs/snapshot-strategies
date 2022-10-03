import { multicall } from '../../utils';

export const author = 'programmablewealth';
export const version = '0.0.1';

const contractAbi = [
  'function gltrAllUnstakedLPTokenVotingPower(address _account) public view returns (uint256)'
];

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  options.votingPowerAddress = options.votingPowerAddress || '0x0D00800489dcAb402D4A17C5BAAfe80c4E22a5d9';
 
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const unstakedLPTokensQuery = addresses.map((address: string) => [
    options.votingPowerAddress,
    'gltrAllUnstakedLPTokenVotingPower',
    [address]
  ]);

  let slicedQueries:any = [unstakedLPTokensQuery];
  if (unstakedLPTokensQuery.length > 1) {
    let middle = unstakedLPTokensQuery.length/2;
    slicedQueries = [
      unstakedLPTokensQuery.slice(0, middle),
      unstakedLPTokensQuery.slice(middle, unstakedLPTokensQuery.length)
    ];
  }

  let res = await multicall(
    network,
    provider,
    contractAbi,
    [
      ...slicedQueries[0],
    ],
    { blockTag }
  );

  if (slicedQueries.length > 1) {
    const res2 = await multicall(
      network,
      provider,
      contractAbi,
      [
        ...slicedQueries[1]
      ],
      { blockTag }
    );

    res = [...res, ...res2 ];
  }

  let entries = {};
  for (let addressIndex = 0; addressIndex < addresses.length; addressIndex++) {
    let totalVotingPower = Number(res[addressIndex][0].toString()) / 1e18;
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


  return entries;
}