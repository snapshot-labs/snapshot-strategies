import { subgraphRequest } from '../../utils';

export const author = 'karamorf';
export const version = '0.1.0';

const LIMIT = 1000;

function makeQuery(snapshot, minter, lastUpdatedAt, blacklisted_accounts) {
  const query: any = {
    accountNFTSlots: {
      __args: {
        where: {
          nft_: { minter: minter },
          account_not_in: blacklisted_accounts,
          lastUpdatedAt_gt: lastUpdatedAt
        },
        first: LIMIT
      },
      account: { address: true },
      balance: true,
      lastUpdatedAt: true
    }
  };

  if (snapshot !== 'latest') {
    query.accountNFTSlots.__args = {
      ...query.accountNFTSlots.__args,
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
  let blacklisted_ids = options.blacklisted_account_ids;
  const balances = {};
  let lastUpdatedAt = 0;
  let response_size = 0;

  if (!blacklisted_ids || blacklisted_ids.length === 0) {
    blacklisted_ids = [''];
  }

  do {
    const response = await subgraphRequest(
      options.graph,
      makeQuery(
        snapshot,
        options.minter_account_id,
        lastUpdatedAt,
        blacklisted_ids
      )
    );

    response.accountNFTSlots.forEach((slot) => {
      if (!balances.hasOwnProperty(slot.account.address)) {
        balances[slot.account.address] = 0;
      }
      balances[slot.account.address] += parseInt(slot.balance);
      lastUpdatedAt = slot.lastUpdatedAt;
    });
    response_size = response.accountNFTSlots.length;
  } while (response_size == LIMIT);

  const scores = Object.fromEntries(
    addresses.map((address) => [address, balances[address.toLowerCase()]])
  );

  return scores;
}
