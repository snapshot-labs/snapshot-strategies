import { WeiPerEther, Zero, One } from '@ethersproject/constants';
import { formatEther } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { StaticJsonRpcProvider } from '@ethersproject/providers';

import { getBlockNumber, subgraphRequest } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'carlosfebres';
export const version = '1.0.1';

const ECO_SUBGRAPH_BY_CHAIN_ID = {
  '1': 'https://api.thegraph.com/subgraphs/name/ecographs/the-eco-currency-subgraphs',
  '5': 'https://api.thegraph.com/subgraphs/name/ecographs/staging-subgraphs'
};

const TOKEN_DELEGATEES_FIELDS = {
  amount: true,
  delegator: {
    id: true
  }
};

interface TokenDelegateesResult {
  amount: string;
  delegator: {
    id: string;
  };
}

interface QueryResult {
  account: {
    ecoTokenDelegatees: TokenDelegateesResult[];
    ecoCurrentTokenDelegatees: TokenDelegateesResult[];
    stakedEcoXTokenDelegatees: TokenDelegateesResult[];
    stakedEcoXCurrentTokenDelegatees: TokenDelegateesResult[];
  };
  inflationMultipliers: {
    value: string;
  }[];
}

function calculateVotingPower(
  ecoVp: BigNumber,
  stakedEcoXVp: BigNumber
): BigNumber {
  return stakedEcoXVp.add(ecoVp.div(10));
}

function createDelegationList(
  items: TokenDelegateesResult[],
  inflationMultiplier = One
): Record<string, BigNumber> {
  return Object.fromEntries(
    items.map((item) => [
      item.delegator.id,
      BigNumber.from(item.amount).div(inflationMultiplier)
    ])
  );
}

export async function strategy(
  space: string,
  network: string,
  provider: StaticJsonRpcProvider,
  addresses: string[],
  options,
  snapshot: number | 'latest'
): Promise<Record<string, number>> {
  const _addresses = addresses.map((addr) => addr.toLowerCase());
  const blockNumber =
    snapshot !== 'latest' ? snapshot : await getBlockNumber(provider);

  const baseFilter = {
    blockStarted_lte: blockNumber,
    delegator_in: _addresses
  };

  const query = {
    account: {
      __args: { id: options.delegatee.toLowerCase() },
      ecoTokenDelegatees: {
        __aliasFor: 'tokenDelegatees',
        __args: {
          where: {
            ...baseFilter,
            token: 'eco',
            blockEnded_gt: blockNumber
          }
        },
        ...TOKEN_DELEGATEES_FIELDS
      },
      ecoCurrentTokenDelegatees: {
        __aliasFor: 'tokenDelegatees',
        __args: {
          where: {
            ...baseFilter,
            token: 'eco',
            blockEnded: null
          }
        },
        ...TOKEN_DELEGATEES_FIELDS
      },
      stakedEcoXTokenDelegatees: {
        __aliasFor: 'tokenDelegatees',
        __args: {
          where: {
            ...baseFilter,
            token: 'sEcox',
            blockEnded_gt: blockNumber
          }
        },
        ...TOKEN_DELEGATEES_FIELDS
      },
      stakedEcoXCurrentTokenDelegatees: {
        __aliasFor: 'tokenDelegatees',
        __args: {
          where: {
            ...baseFilter,
            token: 'sEcox',
            blockEnded: null
          }
        },
        ...TOKEN_DELEGATEES_FIELDS
      }
    },
    inflationMultipliers: {
      __args: {
        first: 1,
        orderBy: 'blockNumber',
        orderDirection: 'desc',
        where: { blockNumber_lte: blockNumber }
      },
      value: true
    }
  };

  const subgraphUrl = ECO_SUBGRAPH_BY_CHAIN_ID[network];
  if (subgraphUrl == undefined) {
    throw new Error(`Unsupported network with id: ${network}`);
  }

  const { account: account, inflationMultipliers }: QueryResult =
    await subgraphRequest(subgraphUrl, query);

  if (!account) {
    return Object.fromEntries(
      _addresses.map((address) => [getAddress(address), 0])
    );
  }

  const inflationMultiplier = inflationMultipliers.length
    ? BigNumber.from(inflationMultipliers[0].value)
    : WeiPerEther;

  const ecoHistoricalDelegations = createDelegationList(
    account.ecoTokenDelegatees,
    inflationMultiplier
  );
  const ecoCurrentDelegations = createDelegationList(
    account.ecoCurrentTokenDelegatees,
    inflationMultiplier
  );
  const stakedEcoXHistoricalDelegations = createDelegationList(
    account.stakedEcoXTokenDelegatees
  );
  const stakedEcoXCurrentDelegations = createDelegationList(
    account.stakedEcoXCurrentTokenDelegatees
  );

  return Object.fromEntries(
    _addresses.map((address) => {
      const ecoHistorical = ecoHistoricalDelegations[address] || Zero;
      const ecoCurrent = ecoCurrentDelegations[address] || Zero;
      const stakedEcoXHistorical =
        stakedEcoXHistoricalDelegations[address] || Zero;
      const stakedEcoXCurrent = stakedEcoXCurrentDelegations[address] || Zero;

      return [
        getAddress(address),
        parseInt(
          formatEther(
            calculateVotingPower(
              ecoHistorical.add(ecoCurrent),
              stakedEcoXHistorical.add(stakedEcoXCurrent)
            )
          )
        )
      ];
    })
  );
}
