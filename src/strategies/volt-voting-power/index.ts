import { formatUnits } from '@ethersproject/units';

import { strategy as pagination } from '../pagination';

import { subgraphRequest } from '../../utils';

export const author = 'philipappiah';
export const version = '0.1.2';

const VOLTSWAP_SUBGRAPH = {
  '82': 'https://graph-meter.voltswap.finance/subgraphs/name/meterio/uniswap-v2-subgraph',
  '361':
    'https://graph-theta.voltswap.finance/subgraphs/name/theta/uniswap-v2-subgraph'
};

const STAKING_SUBGRAPH = {
  '82': 'https://graph-meter.voltswap.finance/subgraphs/name/meter/geyser-v2',
  '361': 'https://graph-theta.voltswap.finance/subgraphs/name/theta/geyser-v2'
};

export async function strategy(
  _space,
  _network,
  _provider,
  addresses,
  options
) {
  const lpTokenAddress = options.lpTokenAddress.toLowerCase();
  const voltAddress = options.voltAddress.toLowerCase();
  const tokenDecimals = options.tokenDecimals;
  const network = options.network || _network;
  const UNI_GRAPH = options.swapSubgraph || VOLTSWAP_SUBGRAPH[network];
  const STAKE_GRAPH = options.stakingSubgraph || STAKING_SUBGRAPH[network];
  const blockTag = 'latest';

  const voltDataparams = {
    users: {
      __args: {
        where: {
          id_in: addresses.map((address) => address.toLowerCase())
        },
        first: 1000
      },
      id: true,

      vaults: {
        id: true,
        locks: {
          __args: {
            where: {
              token_in: [voltAddress, lpTokenAddress]
            }
          },
          id: true,
          token: true,
          amount: true,
          stakeUnits: true
        }
      }
    }
  };

  const subgraphDataParams = {
    pairs: {
      __args: {
        where: {
          id: lpTokenAddress.toLowerCase()
        },
        first: 1
      },
      id: true,
      token0: {
        id: true
      },
      reserve0: true,
      token1: {
        id: true
      },
      reserve1: true,
      totalSupply: true
    }
  };

  const poolData = await subgraphRequest(STAKE_GRAPH, voltDataparams);

  const subgraphData = await subgraphRequest(UNI_GRAPH, subgraphDataParams);

  let totalVoltComposition = 0;
  let totalStake = 0;

  if (subgraphData && subgraphData.pairs) {
    subgraphData.pairs.forEach((lp) => {
      const isToken0 = lp.token0.id.toLowerCase() === voltAddress;
      if (isToken0) {
        totalVoltComposition = lp.reserve0;
      } else {
        totalVoltComposition = lp.reserve1;
      }
      totalStake = lp.totalSupply;
    });
  }

  let results: any = {};

  results = await pagination(
    _space,
    network,
    _provider,
    addresses,
    {
      limit: 200,
      address: voltAddress,
      strategy: {
        name: 'erc20-balance-of',
        params: {
          address: voltAddress,
          decimals: tokenDecimals
        }
      }
    },
    blockTag
  );

  return Object.fromEntries(
    addresses.map((address) => {
      const balance = results?.[address] || 0;
      let userLpShare = 0;
      let userCurrentStakeInVolt = 0;
      let userCurrentStakeInLP = 0;
      let stakesOfVoltInLp = 0;

      if (poolData && poolData.users.length) {
        const user = poolData.users.find(
          (r) => r.id.toLowerCase() === address.toLowerCase()
        );
        if (user && user.vaults.length) {
          user.vaults.forEach((v) => {
            v.locks
              .filter((r) => r.token.toLowerCase() === voltAddress)
              .forEach((vlock) => {
                userCurrentStakeInVolt =
                  userCurrentStakeInVolt +
                  Number(formatUnits(vlock.amount, tokenDecimals));
              });
            v.locks
              .filter((r) => r.token.toLowerCase() === lpTokenAddress)
              .forEach((lplock) => {
                userCurrentStakeInLP =
                  userCurrentStakeInLP +
                  Number(formatUnits(lplock.amount, tokenDecimals));
              });

            userLpShare = (userCurrentStakeInLP / totalStake) * 100;
            stakesOfVoltInLp = (userLpShare / 100) * totalVoltComposition;
          });
        }

        // user address => user's volt balance + staked volt balance + User LP share mapped volt balance
      }

      return [address, balance + userCurrentStakeInVolt + stakesOfVoltInLp];
    })
  );
}
