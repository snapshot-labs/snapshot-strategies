import { multicall } from '../../utils';
import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'eric-conv';
export const version = '0.1.0';

interface LP_TOKEN {
  [address: string]: {
    totalSupply: BigNumber,
    totalToken: BigNumber
  }
}

const lpTokenContractAbi = [
  'function getReserves() public view returns (uint112, uint112, uint32)',
  'function token0() public view returns (address)',
  'function token1() public view returns (address)',
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() public view returns (uint256)'
]

const stakingPoolsV2ContractAbi = [
  'function getReward(uint256 poolId, address staker, uint8 rewarderIdx) external view returns (uint256)',
  'function userData(uint256 poolId, address staker) view returns (uint256, uint32)',
  'function poolInfos(uint256 poolId) view returns (uint256, address, uint256, uint256)'
]

const rewarderV2ContractAbi = [
  'function calculateTotalReward(address user, uint256 poolId) external view returns (uint256)'
]

function bn(num: any): BigNumber {
  return BigNumber.from(num.toString());
}

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  let lpMultiCalls = options.lpTokenAddresses.map((lpAddress: any) => {
    return multicall(
      network,
      provider,
      lpTokenContractAbi,
      [
        [lpAddress, 'token0', []],
        [lpAddress, 'token1', []],
        [lpAddress, 'getReserves', []],
        [lpAddress, 'totalSupply', []],
        ...addresses.map((userAddress: any) => [
          lpAddress,
          'balanceOf',
          [userAddress]
        ])
      ],
      { blockTag }
    )
  });

  let stakingPoolsMultiCalls = [];

  // Staking pool version:
  // 1: Single reward
  // 2: Multi reward
  if (options.stakingPoolsVersion === "2"){
    stakingPoolsMultiCalls = options.stakingPoolIds.map((poolId: any) => {
      return multicall(
        network,
        provider,
        stakingPoolsV2ContractAbi,
        [
          [options.stakingPoolsAddress, 'poolInfos', [poolId]],
          ...addresses.map((userAddress: any) => [
            options.stakingPoolsAddress,
            'userData',
            [poolId, userAddress]
          ]),
          ...addresses.map((userAddress: any) => [
            options.stakingPoolsAddress,
            'getReward',
            [poolId, userAddress, options.stakingPoolRewarderIdx]
          ])
        ],
        { blockTag }
      )
    })
  } else if (options.stakingPoolsVersion === "1"){

  }

  let stakingPoolRewarderMultiCalls = [];

  //  Staking pool rewarder version:
  // 1: Old rewarder
  // 2. New rewarder
  if (options.rewarderVersion === "2"){
    stakingPoolRewarderMultiCalls = options.stakingPoolIds.map((poolId: any) => {
      return multicall(
        network,
        provider,
        rewarderV2ContractAbi,
        [
          ...addresses.map((userAddress: any) => [
            options.rewarderAddress,
            'calculateTotalReward',
            [userAddress, poolId]
          ])
        ],
        { blockTag }
      )
    })
  }

  let res = await Promise.all([
    ...lpMultiCalls,
    ...stakingPoolsMultiCalls,
    ...stakingPoolRewarderMultiCalls
  ])

  let usersTokensFromLp: BigNumber[] = [];
  let lpTokens: LP_TOKEN = {};

  // LP Token Calculation

  for(let i = 0; i < options.lpTokenAddresses.length; i++){
    const token0Addr = res[0];
    const token1Addr = res[1];
    const reserve0 = bn(res[2]._reserve0);
    const reserve1 = bn(res[2]._reserve1);
    const totalSupply = bn(res[3]);
    res = res.slice(4);

    let tokenInLP = bn(0);
    if (token0Addr === options.address){
      tokenInLP = reserve0.mul(bn(2));
    } else if (token1Addr === options.address) {
      tokenInLP = reserve1.mul(bn(2));
    }

    res.slice(0, addresses.length).map((num, i) => {
      const lpTokenBal = bn(num);
      usersTokensFromLp[i] = usersTokensFromLp[i].add(lpTokenBal.mul(tokenInLP).div(totalSupply))
    })
    res = res.slice(addresses.length);

    lpTokens[options.lpTokenAddresses[i]] = {
      totalSupply,
      totalToken: tokenInLP
    }
  }

  // Staking Pools Calculation

  for (let i = 0; i < options.stakingPoolIds.length; i++){
    const poolToken = res[0].poolToken;
    res = res.slice(1);

    if (lpTokens[poolToken] === undefined){
      // single side staking
      res.slice(0, addresses.length).map((userData, i) => {
        const stakingBal = bn(userData.stakeAmount);
        usersTokensFromLp[i] = usersTokensFromLp[i].add(stakingBal);
      })
      res = res.slice(addresses.length);
      res.slice(0, addresses.length).map((num, i) => {
        const pendingReward = bn(num);
        usersTokensFromLp[i] = usersTokensFromLp[i].add(pendingReward);
      })
      res = res.slice(addresses.length);
    } else {
      // LP token staking
      const totalSupply = lpTokens[poolToken].totalSupply;
      const totalToken = lpTokens[poolToken].totalToken;
      res.slice(0, addresses.length).map((userData, i) => {
        const stakedLPBal = bn(userData.stakeAmount);
        usersTokensFromLp[i] = usersTokensFromLp[i].add(stakedLPBal.mul(totalToken).div(totalSupply));
      })
      res = res.slice(addresses.length);
      res.slice(0, addresses.length).map((num, i) => {
        const pendingReward = bn(num);
        usersTokensFromLp[i] = usersTokensFromLp[i].add(pendingReward);
      })
      res = res.slice(addresses.length);
    }
  }

  // Rewarder Calculation
  for (let i = 0; i < options.stakingPoolIds.length; i++){
    if (options.rewarderVersion === "2"){
      res.slice(0, addresses.length).map((num, i) => {
        const rewarderBal = bn(num);
        usersTokensFromLp[i] = usersTokensFromLp[i].add(rewarderBal);
      })
      res = res.slice(addresses.length);
    } else {

    }
  }

  return Object.fromEntries(
    usersTokensFromLp.map((sum, i) => {
      const parsedSum = parseFloat(formatUnits(sum, options.decimal));
      return [addresses[i], parsedSum];
    })
  );
}
