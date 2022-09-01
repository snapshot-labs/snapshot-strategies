import { subgraphRequest } from '../../utils';

export const author = 'karamorf';
export const version = '0.1.1';

const LIMIT = 500;

function makeQuery(minter, skip, blacklisted_accounts) {
  const query: any = {
    nonFungibleTokens: {
      __args: {
        where: {
          minter: minter,
          slots_: {
            account_not_in: blacklisted_accounts
          }
        },
        first: LIMIT,
        skip: skip
      },
      token: true,
      slots: {
        account: {
          address: true
        },
        balance: true
      }
    }
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
  console.log("hello");
  let balances = {};
  let skip = 0;
  let result_size = 0;

  do {
    const query = makeQuery(options.minter, skip, options.blacklisted_accounts);
    const response = await subgraphRequest(
      options.graph, query
    );
    const tokens = response.map((data) => data.nonFungibleTokens).flat();

    tokens.forEach((token) => {
      token.slots.forEach((slot) => {
        if(! balances.hasOwnProperty(slot.account.address)) {
          balances[slot.account.address] = 0;
        }
        balances[slot.account.address] += parseInt(slot.balance);
      })
    });

    result_size = tokens.length
    skip += result_size;
  } while(result_size == LIMIT);

  return balances;
}
