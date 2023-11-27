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

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const walletQuery = addresses.map((address: string) => [
    options.wapGhstAddress,
    'balanceOf',
    [address]
  ]);

  const stakeQuery = addresses.map((address: string) => [
    options.gltrStakingAddress,
    'allUserInfo',
    [address]
  ]);

  let slicedWalletQueries: any = [walletQuery];
  if (walletQuery.length > 1) {
    const middle = walletQuery.length / 2;
    slicedWalletQueries = [
      walletQuery.slice(0, middle),
      walletQuery.slice(middle, walletQuery.length)
    ];
  }

  let res = await multicall(
    network,
    provider,
    tokenAbi,
    [...slicedWalletQueries[0]],
    { blockTag }
  );

  if (slicedWalletQueries.length > 1) {
    const res2 = await multicall(
      network,
      provider,
      tokenAbi,
      [...slicedWalletQueries[1]],
      { blockTag }
    );

    res = [...res, ...res2];
  }

  let slicedStakeQueries: any = [stakeQuery];
  if (stakeQuery.length > 1) {
    const middle = stakeQuery.length / 2;
    slicedStakeQueries = [
      stakeQuery.slice(0, middle),
      stakeQuery.slice(middle, stakeQuery.length)
    ];
  }

  const res3 = await multicall(
    network,
    provider,
    tokenAbi,
    [...slicedStakeQueries[0]],
    { blockTag }
  );
  res = [...res, ...res3];

  if (slicedStakeQueries.length > 1) {
    const res4 = await multicall(
      network,
      provider,
      tokenAbi,
      [...slicedStakeQueries[1]],
      { blockTag }
    );

    res = [...res, ...res4];
  }

  const unitWapGHST_res = await multicall(
    network,
    provider,
    tokenAbi,
    [[options.wapGhstAddress, 'convertToAssets', ['1000000000000000000']]],
    { blockTag }
  );
  const wapGHST_ghstMulitiplier = Number(unitWapGHST_res[0].toString()) / 1e18;

  const entries = {};
  for (let addressIndex = 0; addressIndex < addresses.length; addressIndex++) {
    const tokens = {
      staked: {
        wapGhst:
          Number(
            res[addressIndex + addresses.length]._info[
              options.wapGhstPoolId
            ].userBalance.toString()
          ) / 1e18
      },
      unstaked: {
        wapGhst: Number(res[addressIndex].toString()) / 1e18
      }
    };

    const votingPower = {
      staked: {
        wapGhst: tokens.staked.wapGhst * wapGHST_ghstMulitiplier
      },
      unstaked: {
        wapGhst: tokens.unstaked.wapGhst * wapGHST_ghstMulitiplier
      }
    };

    let totalVotingPower = 0;
    for (let k = 0; k < Object.keys(votingPower.unstaked).length; k++) {
      const key = Object.keys(votingPower.unstaked)[k];
      totalVotingPower += votingPower.unstaked[key];
    }
    for (let k = 0; k < Object.keys(votingPower.staked).length; k++) {
      const key = Object.keys(votingPower.staked)[k];
      totalVotingPower += votingPower.staked[key];
    }

    const address = addresses[addressIndex];

    // let loggedString = "TOKENS SUMMARY FOR " + address;
    // loggedString += "\nSTAKED TOKENS\n" + JSON.stringify(tokens.staked);
    // loggedString += "\nUNSTAKED TOKENS\n" + JSON.stringify(tokens.unstaked);
    // loggedString += "\nSTAKED VOTING POWER\n" + JSON.stringify(votingPower.staked);
    // loggedString += "\nUNSTAKED VOTING POWER\n" + JSON.stringify(votingPower.unstaked);
    // loggedString += "\nTOTAL VOTING POWER\n" + totalVotingPower;
    // console.log(loggedString);

    entries[address] = totalVotingPower;
  }

  return entries;
}
