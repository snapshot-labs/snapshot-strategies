import { getAddress as formatEthAddress } from '@ethersproject/address';
import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { strategy as erc721BalanceOfStrategy } from '../erc721';
import { Multicaller, subgraphRequest } from '../../utils';

export const author = 'longfin';
export const version = '1.1.0';
export const dependOnOtherAddress = false;

const lpStakingABI = [
  'function stakedTokenBalance(address account) view returns (uint256)'
];

const erc20ABI = [
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)'
];

interface Options {
  ethLPTokenStakingAddress: string;
  ethLPTokenAddress: string;
  ethWNCGAddress: string;
  ethBalancerVaultAddress: string;
  ethDccAddress: string;
  ncBlockHash: string;
  ncGraphQLEndpoint: string;
  wncgDecimals: number;
  weights: {
    stakedWNCG: number;
    dcc: number;
    stakedNCG: number;
  };
}

export async function strategy(
  space,
  network,
  provider,
  addresses: string[],
  options,
  snapshot
): Promise<Record<string, number>> {
  const {
    ethLPTokenStakingAddress,
    ethLPTokenAddress,
    ethWNCGAddress,
    ethBalancerVaultAddress,
    ethDccAddress,
    ncBlockHash,
    ncGraphQLEndpoint,
    wncgDecimals = 18,
    weights: {
      stakedWNCG: stakedWNCGWeight = 1,
      dcc: dccWeight = 999,
      stakedNCG: stakedNCGWeight = 1
    }
  }: Options = options;

  addresses = addresses.map(formatEthAddress);

  const dccScores = erc721BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    { address: ethDccAddress },
    snapshot
  ).then((scores) => {
    Object.keys(scores).forEach((addr) => {
      scores[addr] *= dccWeight;
    });
    return scores;
  });

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const { wNCGInVault, totalLPSupply }: Record<string, BigNumber> =
    await new Multicaller(network, provider, erc20ABI, { blockTag })
      .call('wNCGInVault', ethWNCGAddress, 'balanceOf', [
        ethBalancerVaultAddress
      ])
      .call('totalLPSupply', ethLPTokenAddress, 'totalSupply', [])
      .execute();

  const lpStakingChecker = new Multicaller(network, provider, lpStakingABI, {
    blockTag
  });
  addresses.forEach((address) =>
    lpStakingChecker.call(
      address,
      ethLPTokenStakingAddress,
      'stakedTokenBalance',
      [address]
    )
  );
  const stakedWNCGScores = lpStakingChecker
    .execute()
    .then((rawScores: Record<string, BigNumber>) => {
      const scores = {};
      Object.keys(rawScores).forEach((addr) => {
        const amount = rawScores[addr]
          .mul(wNCGInVault)
          .mul(stakedWNCGWeight)
          .div(totalLPSupply);
        scores[addr] = parseFloat(formatUnits(amount, wncgDecimals));
      });

      return scores;
    });
  const stakedNCGQuery = {
    stateQuery: {
      __args: {
        hash: ncBlockHash
      },

      stakeStates: {
        __args: {
          addresses: addresses
        },

        deposit: true
      }
    }
  };

  const stakedNCGScores = subgraphRequest(
    ncGraphQLEndpoint,
    stakedNCGQuery
  ).then((resp) => {
    const scores: Record<string, number> = {};
    addresses.forEach((addr, i) => {
      const stakeState = resp.stateQuery.stakeStates[i];
      scores[addr] = parseFloat(
        formatUnits(
          parseUnits(stakeState?.deposit ?? '0.00', 2).mul(stakedNCGWeight),
          2
        )
      );
    });

    return scores;
  });

  const allScores = await Promise.all([
    dccScores,
    stakedWNCGScores,
    stakedNCGScores
  ]);

  return allScores.reduce((total, scores) => {
    for (const [address, value] of Object.entries(scores)) {
      if (!total[address]) {
        total[address] = 0;
      }
      total[address] += value;
    }
    return total;
  }, {});
}
