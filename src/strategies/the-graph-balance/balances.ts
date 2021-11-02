import { BigNumber } from '@ethersproject/bignumber';
import { Provider } from '@ethersproject/providers';
import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';
import {
  GRAPH_NETWORK_SUBGRAPH_URL,
  GraphAccountScores,
  GraphStrategyOptions
} from '../the-graph/graphUtils';

const GNS_ADDRESS = '0xadca0dd4729c8ba3acf3e99f3a9f471ef37b6825';

export type Curator = {
  id: string;
  signals: Signal[];
  nameSignals: NameSignal[];
};

export type Signal = {
  signal: string;
  subgraphDeployment: SubgraphDeployment;
};

export type NameSignal = {
  signal: string;
  nameSignal: string;
  subgraph: Subgraph;
};

export type SubgraphDeployment = {
  id: string;
  signalledTokens: string;
  signalAmount: string;
};

export type Subgraph = {
  id: string;
  withdrawableTokens: string;
  currentSignalledTokens: string;
  signalAmount: string;
  nameSignalAmount: string;
  currentVersion: {
    subgraphDeployment: SubgraphDeployment;
  };
};

export const ETH_IN_WEI = 1000000000000000000;

export function getCuratorSignalledGRT(curator: Curator): number {
  const { signals, nameSignals } = curator;
  let result = 0;
  // Get GRT of Curator for the signal they have in each Deployment
  for (const signal of signals) {
    const deployment = signal.subgraphDeployment;
    const signalledTokens = parseFloat(deployment.signalledTokens);
    const parsedSignal = parseFloat(signal.signal);
    const signalAmount = parseFloat(deployment.signalAmount);
    // we calculate the value of their signal based on the share they have
    // of the total signal in the subgraph deployment
    const deploymentSignalShareCoeficient = signalAmount
      ? signalledTokens / signalAmount
      : 0;
    result += deploymentSignalShareCoeficient * parsedSignal;
  }
  // Get GRT of Curator for the name signal they have in each Deployment
  for (const nameSignal of nameSignals) {
    if (nameSignal.subgraph.withdrawableTokens === '0') {
      const deployment = nameSignal.subgraph.currentVersion.subgraphDeployment;
      const signalledTokens = parseFloat(deployment.signalledTokens);
      const signal = parseFloat(nameSignal.signal);
      const signalAmount = parseFloat(deployment.signalAmount);
      const deploymentSignalShareCoeficient = signalAmount
        ? signalledTokens / signalAmount
        : 0;

      result += deploymentSignalShareCoeficient * signal;
    } else {
      // edge case where curators didn't withdraw their signal from a deprecated subgraph
      const subgraph = nameSignal.subgraph;
      const withdrawableTokens = parseFloat(subgraph.withdrawableTokens);
      const _nameSignal = parseFloat(nameSignal.nameSignal);
      const nameSignalAmount = parseFloat(subgraph.nameSignalAmount);
      const subgraphNameSignalShareCoeficient = nameSignalAmount
        ? withdrawableTokens / nameSignalAmount
        : 0;

      result += subgraphNameSignalShareCoeficient * _nameSignal;
    }
  }
  // result is in wei, format it in GRT
  return result / ETH_IN_WEI;
}

export async function balanceStrategy(
  _space: string,
  network: string,
  _provider: Provider,
  addresses: string[],
  _options: GraphStrategyOptions,
  snapshot: string | number
): Promise<GraphAccountScores> {
  const balanceParams = {
    graphAccounts: {
      __args: {
        where: {
          id_in: addresses
        },
        first: _options.pageSize
      },
      id: true,
      balance: true
    },
    curators: {
      __args: {
        where: { id_in: addresses, id_not: GNS_ADDRESS },
        first: _options.pageSize
      },
      id: true,
      signals: {
        signal: true,
        subgraphDeployment: {
          id: true,
          signalledTokens: true,
          signalAmount: true
        }
      },
      nameSignals: {
        signal: true,
        nameSignal: true,
        subgraph: {
          id: true,
          withdrawableTokens: true,
          currentSignalledTokens: true,
          signalAmount: true,
          nameSignalAmount: true,
          currentVersion: {
            subgraphDeployment: {
              signalledTokens: true,
              signalAmount: true
            }
          }
        }
      }
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    balanceParams.graphAccounts.__args.block = { number: snapshot };
    // @ts-ignore
    balanceParams.curators.__args.block = { number: snapshot };
  }

  const result = await subgraphRequest(
    GRAPH_NETWORK_SUBGRAPH_URL[network],
    balanceParams
  );

  // No normalization factor for balances. 1 GRT in wallet is the baseline to compare
  // Delegators and Indexers to.
  const score: GraphAccountScores = {};
  if (result && result.graphAccounts) {
    // Must iterate on addresses since the query can return nothing for a beneficiary that has
    // only interacted through token lock wallets
    addresses.forEach((address) => {
      let balanceScore = 0;
      const graphAccount = result.graphAccounts.find(
        (account) => account.id === address
      );
      if (graphAccount) {
        balanceScore = parseFloat(
          formatUnits(BigNumber.from(graphAccount.balance))
        );
        const curator = result.curators.find(
          (_curator) => _curator.id === address
        );
        if (curator) {
          // For curators we also consider the tokens they have locked in active signal
          // as part of their balance
          balanceScore += getCuratorSignalledGRT(curator);
        }
      }
      score[address] = balanceScore;
    });
  } else {
    console.error('Subgraph request failed');
  }
  return score || {};
}
