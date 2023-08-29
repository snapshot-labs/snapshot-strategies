import { BigNumber } from '@ethersproject/bignumber';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { subgraphRequest } from '@snapshot-labs/snapshot.js/dist/utils';
import { getAddress } from '@ethersproject/address';
import { formatUnits } from '@ethersproject/units';

export const author = 'RedDuck-Software';
export const version = '0.0.1';

async function getTopHoldersBalance(
  url,
  topHoldersAmount,
  snapshot
): Promise<Record<string, number>> {

  const query = {
    tokenBalances: {
      __args: {
        orderBy: 'amount',
        orderDirection: 'desc',
        first: topHoldersAmount
      },
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    query.users.__args.block = { number: snapshot };
  }

  const topHolders: Record<string, number> = {};

  const result = await subgraphRequest(url, query);

  if (result && result.tokenBalances) {
    result.tokenBalances.forEach((tokenBalance) => {
      const address = getAddress(tokenBalance.account.id);
      const balance = parseFloat(formatUnits(tokenBalance.amount));
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
  const topHoldersAmount = +options.topHolders || 0;

  const balanceScores = await getTopHoldersBalance(
    options.subgraphUrl,
    topHoldersAmount,
    snapshot
  );

  console.log({balanceScores})

  const balanceScoresSortedDesc = Object.fromEntries(
    Object.entries(balanceScores)
      .sort(([_, balanceA], [__, balanceB]) => balanceB - balanceA)
  );


  return Object.fromEntries(
    Object.entries(balanceScoresSortedDesc).map(([address, balance], i) => [
      address,
      topHoldersAmount > 0 &&
        i >= topHoldersAmount
        ? 0
        : balance
    ])
  );
}
