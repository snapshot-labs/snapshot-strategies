import { multicall } from '../../utils';

export const author = 'programmablewealth';
export const version = '0.0.1';

const tokenAbi = [
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function allUserInfo(address _user) view returns (tuple(address lpToken, uint256 allocPoint, uint256 pending, uint256 userBalance, uint256 poolBalance)[] _info)',
  'function convertToAssets(uint256 shares) view returns (uint)',
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

  const res = await multicall(
    network,
    provider,
    tokenAbi,
    [
      ...walletQuery,
      ...stakeQuery,
    ],
    { blockTag }
  );

  // unstaked wapGHST - use convertToAssets which is required for calculating the voting power for wapGHST
  let unstakedConvertedWapGHST:any = [];
  for (let i = 0; i < addresses.length; i++) {
    const unstakedWapGHSTBalance = res[i][0];
    unstakedConvertedWapGHST.push([options.wapGhstAddress, 'convertToAssets', [unstakedWapGHSTBalance]]);
  }

  // staked wapGHST - use convertToAssets which is required for calculating the voting power for wapGHST
  let stakedConvertedWapGHST:any = [];
  for (let i = 0; i < addresses.length; i++) {
    const stakedWapGHSTBalance = res[i+walletQuery.length]._info[options.wapGhstPoolId].userBalance;
    stakedConvertedWapGHST.push([options.wapGhstAddress, 'convertToAssets', [stakedWapGHSTBalance]]);
  }

  // converted wapGHST into GHST (this has a dependency on the unstaked and staked wapGHST balances retrieved in res)
  const wapGHST_res = await multicall(
    network,
    provider,
    tokenAbi,
    [
      ...unstakedConvertedWapGHST,
      ...stakedConvertedWapGHST
    ],
    { blockTag }
  );


  let entries = {};
  for (let addressIndex = 0; addressIndex < addresses.length; addressIndex++) {
    let tokens = {
      staked: {
        wapGhst: Number(res[addressIndex + addresses.length]._info[options.wapGhstPoolId].userBalance.toString()) / 1e18,
      },
      unstaked: {
        wapGhst: Number(res[addressIndex].toString()) / 1e18,
      }
    };

    let votingPower = {
      staked: {
        wapGhst: Number(wapGHST_res[addressIndex + addresses.length].toString()) / 1e18,
      },
      unstaked: {
        wapGhst: Number(wapGHST_res[addressIndex].toString()) / 1e18,
      },
    };

    let totalVotingPower = 0;
    for (let k = 0; k < Object.keys(votingPower.unstaked).length; k++) {
      let key = Object.keys(votingPower.unstaked)[k];
      totalVotingPower += votingPower.unstaked[key];
    }
    for (let k = 0; k < Object.keys(votingPower.staked).length; k++) {
      let key = Object.keys(votingPower.staked)[k];
      totalVotingPower += votingPower.staked[key];
    }

    let address = addresses[addressIndex];

    let loggedString = "TOKENS SUMMARY FOR " + address;
    loggedString += "\nSTAKED TOKENS\n" + JSON.stringify(tokens.staked);
    loggedString += "\nUNSTAKED TOKENS\n" + JSON.stringify(tokens.unstaked);
    loggedString += "\nSTAKED VOTING POWER\n" + JSON.stringify(votingPower.staked);
    loggedString += "\nUNSTAKED VOTING POWER\n" + JSON.stringify(votingPower.unstaked);
    loggedString += "\TOTAL VOTING POWER\n" + totalVotingPower;
    console.log(loggedString);

    entries[address] = totalVotingPower;
  }

  return entries;
}