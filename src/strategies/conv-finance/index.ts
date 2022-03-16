import { multicall } from '../../utils';
import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'eric-convergence';
export const version = '0.1.0';

interface STRATEGY_OPTIONS {
  address: string;
  symbol: string;
  decimals: number;
  lpTokenAddresses: string[];
  stakingPools: STAKING_POOL[];
  rewarder: REWARDER[];
}

interface LP_TOKEN {
  [address: string]: {
    totalSupply: BigNumber;
    totalToken: BigNumber;
  };
}

interface STAKING_POOL {
  address: string;
  version: string;
  pools: STAKING_POOL_INFO[];
}

interface STAKING_POOL_INFO {
  poolId: string;
  rewarderIdx?: string;
}

interface REWARDER {
  address: string;
  version: string;
  poolIds: number[];
}

const lpTokenContractAbi = [
  'function getReserves() public view returns (uint112, uint112, uint32)',
  'function token0() public view returns (address)',
  'function token1() public view returns (address)',
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() public view returns (uint256)'
];

const stakingPoolsV2ContractAbi = [
  'function getReward(uint256 poolId, address staker, uint8 rewarderIdx) external view returns (uint256)',
  'function userData(uint256 poolId, address staker) view returns (uint256, uint32)',
  'function poolInfos(uint256 poolId) view returns (uint256, uint256, uint256, address)'
];

const rewarderV2ContractAbi = [
  'function calculateTotalReward(address user, uint256 poolId) external view returns (uint256)'
];

const stakingPoolsV1ContractAbi = [
  'function getReward(uint256 poolId, address staker) external view returns (uint256)',
  'function userData(uint256 poolId, address staker) view returns (uint256, uint256, uint256)',
  'function poolInfos(uint256 poolId) view returns (uint256, uint256, uint256, uint256, address)'
];

const rewarderV1ContractAbi = [
  'function vestingSchedules(address user, uint256 poolId) view returns(uint128, uint32, uint32, uint32, uint32)'
];

function bn(num: any): BigNumber {
  return BigNumber.from(num.toString());
}

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options: STRATEGY_OPTIONS,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const lpMultiCalls = options.lpTokenAddresses.map((lpAddress: any) => {
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
    );
  });

  const stakingPoolsMultiCalls: Promise<any>[] = [];

  if (options.stakingPools.length <= 5){
    options.stakingPools.forEach((stakingPool: STAKING_POOL) => {
      // Staking pool version:
      // 1: Single reward
      // 2: Multi reward
      if (stakingPool.version === '2') {
        stakingPool.pools.forEach((poolInfo: STAKING_POOL_INFO) => {
          stakingPoolsMultiCalls.push(
            multicall(
              network,
              provider,
              stakingPoolsV2ContractAbi,
              [
                [stakingPool.address, 'poolInfos', [poolInfo.poolId]], // Get pool token
                ...addresses.map((userAddress: any) => [
                  stakingPool.address,
                  'userData',
                  [poolInfo.poolId, userAddress]
                ]),
                ...addresses.map((userAddress: any) => [
                  stakingPool.address,
                  'getReward',
                  [poolInfo.poolId, userAddress, poolInfo.rewarderIdx]
                ])
              ],
              { blockTag }
            )
          );
        });
      } else {
        stakingPool.pools.forEach((poolInfo: STAKING_POOL_INFO) => {
          stakingPoolsMultiCalls.push(
            multicall(
              network,
              provider,
              stakingPoolsV1ContractAbi,
              [
                [stakingPool.address, 'poolInfos', [poolInfo.poolId]], // Get pool token
                ...addresses.map((userAddress: any) => [
                  stakingPool.address,
                  'userData',
                  [poolInfo.poolId, userAddress]
                ]),
                ...addresses.map((userAddress: any) => [
                  stakingPool.address,
                  'getReward',
                  [poolInfo.poolId, userAddress]
                ])
              ],
              { blockTag }
            )
          );
        });
      }
    });
  }

  const stakingPoolRewarderMultiCalls: any[] = [];

  options.rewarder.forEach((rewarder: REWARDER) => {
    if(rewarder.poolIds.length <= 5){
      //  Staking pool rewarder version:
      // 1: Old rewarder
      // 2. New rewarder
      if (rewarder.version === '2') {
        rewarder.poolIds.forEach((id: number) => {
          stakingPoolRewarderMultiCalls.push(
            multicall(
              network,
              provider,
              rewarderV2ContractAbi,
              [
                ...addresses.map((userAddress: any) => [
                  rewarder.address,
                  'calculateTotalReward',
                  [userAddress, id]
                ])
              ],
              { blockTag }
            )
          );
        });
      } else {
        rewarder.poolIds.forEach((id: number) => {
          stakingPoolRewarderMultiCalls.push(
            multicall(
              network,
              provider,
              rewarderV1ContractAbi,
              [
                ...addresses.map((userAddress: any) => [
                  rewarder.address,
                  'vestingSchedules',
                  [userAddress, id]
                ])
              ],
              { blockTag }
            )
          );
        });
      }
    }
  });

  let res = await Promise.all([
    ...lpMultiCalls,
    ...stakingPoolsMultiCalls,
    ...stakingPoolRewarderMultiCalls
  ]);

  const usersTokensFromLp: BigNumber[] = [];
  const lpTokens: LP_TOKEN = {};

  // LP Token Calculation

  options.lpTokenAddresses.forEach((lpAddress: string, idx) => {
    let result = res[idx];
    const token0Addr = result[0][0];
    const token1Addr = result[1][0];
    const reserve0 = bn(result[2][0]);
    const reserve1 = bn(result[2][1]);
    const totalSupply = bn(result[3]);

    result = result.slice(4);

    let tokenInLP = bn(0);
    if (token0Addr === options.address) {
      tokenInLP = reserve0.mul(bn(2));
    } else if (token1Addr === options.address) {
      tokenInLP = reserve1.mul(bn(2));
    }

    result.slice(0, addresses.length).map((num: BigNumber, i: number) => {
      const lpTokenBal = bn(num);
      if (usersTokensFromLp[i] === undefined) {
        usersTokensFromLp[i] = lpTokenBal.mul(tokenInLP).div(totalSupply);
      } else {
        usersTokensFromLp[i] = usersTokensFromLp[i].add(
          lpTokenBal.mul(tokenInLP).div(totalSupply)
        );
      }
    });

    lpTokens[options.lpTokenAddresses[idx].toLowerCase()] = {
      totalSupply,
      totalToken: tokenInLP
    };
  });

  res = res.slice(options.lpTokenAddresses.length);

  // Staking Pools Calculation
  let stakingPoolNumber = 0;
  for (let i = 0; i < options.stakingPools.length; i++) {
    stakingPoolNumber += options.stakingPools[i].pools.length;
  }

  options.stakingPools.forEach((stakingPool: STAKING_POOL, idx) => {
    stakingPool.pools.forEach((poolId, poolIdx) => {
      let result = res[idx + poolIdx];
      let poolToken = '';
      if (stakingPool.version === '2') {
        poolToken = result[0][3];
      } else {
        poolToken = result[0][4];
      }
      result = result.slice(1);

      if (poolToken === options.address) {
        // single side staking
        result.slice(0, addresses.length).map((userData, idx) => {
          const stakingBal = bn(userData[0]);
          usersTokensFromLp[idx] = usersTokensFromLp[idx].add(stakingBal);
        });
        result = result.slice(addresses.length);
        result.slice(0, addresses.length).map((num, idx) => {
          const pendingReward = bn(num);
          usersTokensFromLp[idx] = usersTokensFromLp[idx].add(pendingReward);
        });
      } else if (lpTokens[poolToken.toLowerCase()] !== undefined) {
        // CONV LP token staking
        const totalSupply = lpTokens[poolToken.toLowerCase()].totalSupply;
        const totalToken = lpTokens[poolToken.toLowerCase()].totalToken;
        result.slice(0, addresses.length).map((userData, idx) => {
          const stakedLPBal = bn(userData[0]);
          usersTokensFromLp[idx] = usersTokensFromLp[idx].add(
            stakedLPBal.mul(totalToken).div(totalSupply)
          );
        });
        result = result.slice(addresses.length);
        result.slice(0, addresses.length).map((num, idx) => {
          const pendingReward = bn(num);
          usersTokensFromLp[idx] = usersTokensFromLp[idx].add(pendingReward);
        });
      } else {
        // Non-CONV LP token staking, only calculates pending reward
        result = result.slice(addresses.length);
        result.slice(0, addresses.length).map((num, idx) => {
          const pendingReward = bn(num);
          usersTokensFromLp[idx] = usersTokensFromLp[idx].add(pendingReward);
        });
      }
    });
  });

  res = res.slice(stakingPoolNumber);

  // Rewarder Calculation
  options.rewarder.forEach((rewarder: REWARDER, idx) => {
    rewarder.poolIds.forEach((poolId, poolIdx) => {
      const result = res[idx + poolIdx];
      if (rewarder.version === '2') {
        result.slice(0, addresses.length).map((num, i) => {
          const rewarderBal = bn(num);
          usersTokensFromLp[i] = usersTokensFromLp[i].add(rewarderBal);
        });
      } else {
        result.slice(0, addresses.length).map((vestingSchedule, i) => {
          const vestingAmount = bn(vestingSchedule[0]);
          if (vestingAmount.gt(bn(0))) {
            const startTime = parseInt(vestingSchedule[1]);
            const endTime = parseInt(vestingSchedule[2]);
            const lastClaimTime = parseInt(vestingSchedule[4]);
            const step = parseInt(vestingSchedule[3]);
            const totalStep = (endTime - startTime) / step;
            const remainingStep = (endTime - lastClaimTime) / step;
            const rewarderBal = vestingAmount
              .div(bn(totalStep))
              .mul(bn(remainingStep));
            usersTokensFromLp[i] = usersTokensFromLp[i].add(rewarderBal);
          }
        });
      }
    });
  });

  return Object.fromEntries(
    usersTokensFromLp.map((sum, i) => {
      const parsedSum = parseFloat(formatUnits(sum, options.decimals));
      return [addresses[i], parsedSum];
    })
  );
}
