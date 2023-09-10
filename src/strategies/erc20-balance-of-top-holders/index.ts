import { subgraphRequest } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'RedDuck-Software';
export const version = '0.0.1';

async function getTopHoldersBalance(
  url,
  options,
  snapshot
): Promise<Record<string, number>> {
  const topHoldersAmount = +options.topHolders || 0;

  const query = {
    erc20Balances: {
      __args: {
        where: {
          account_not: null,
          contract: options.address
        },
        orderBy: 'valueExact',
        orderDirection: 'desc',
        first: topHoldersAmount
      },
      value: true,
      contract: true,
      account: {
        id: true
      }
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    query.erc20Balances.__args.block = { number: snapshot };
  }

  const topHolders: Record<string, number> = {};

  const result = await subgraphRequest(url, query);

  if (result && result.erc20Balances) {
    result.erc20Balances.forEach((tokenBalance) => {
      const address = getAddress(tokenBalance.account.id);
      const balance = parseFloat(tokenBalance.value);
      topHolders[address] = balance;
    });
  }

  return topHolders;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const topHoldersBalancesScores = await getTopHoldersBalance(
    options.subgraphUrl,
    options,
    snapshot
  );

  return Object.fromEntries(
    addresses.map((address) => [
      address,
      topHoldersBalancesScores[address] ? topHoldersBalancesScores[address] : 0
    ])
  );
}
