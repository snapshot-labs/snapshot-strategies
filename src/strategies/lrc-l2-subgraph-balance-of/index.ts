import { BigNumber } from '@ethersproject/bignumber';
import { subgraphRequest } from '../../utils';

export const author = 'shad-k';
export const version = '0.1.1';

const LIMIT = 500;

function makeQuery(snapshot, addresses, tokenId) {
  const query: any = {
    accounts: {
      __args: {
        where: {
          address_in: addresses
        },
        first: LIMIT
      },
      balances: {
        __args: {
          where: {
            token_in: [`${tokenId}`]
          }
        },
        balance: true,
        token: {
          decimals: true
        }
      },
      address: true
    }
  };

  if (snapshot !== 'latest') {
    query.accounts.__args = {
      ...query.accounts.__args,
      block: {
        number: snapshot
      }
    };
  }

  return query;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const _addresses = addresses.map((address) => address.toLowerCase());
  const addressSubsets = Array.apply(
    null,
    Array(Math.ceil(_addresses.length / LIMIT))
  ).map((_e, i) => _addresses.slice(i * LIMIT, (i + 1) * LIMIT));

  const response = await Promise.all(
    addressSubsets.map((subset) =>
      subgraphRequest(
        options.graph,
        makeQuery(snapshot, subset, options.tokenId)
      )
    )
  );

  const accounts = response.map((data) => data.accounts).flat();
  const addressToBalanceMap = Object.fromEntries(
    accounts.map((account) => {
      if (account.balances.length > 0) {
        return [
          account.address,
          BigNumber.from(account.balances[0].balance)
            .div(
              BigNumber.from(10).pow(account.balances[0]?.token?.decimals ?? 18)
            )
            .toNumber()
        ];
      }

      return [account.address, 0];
    })
  );

  const scores = Object.fromEntries(
    addresses.map((address) => [
      address,
      addressToBalanceMap[address.toLowerCase()]
    ])
  );
  return scores;
}
