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
    query.accountNFTSlots.__args.where = {
      ...query.accountNFTSlots.__args.where,
      _change_block: {
        number_gte: snapshot
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
  let balances = {};
  let lastUpdatedAt = 0;
  let response_size = 0;
  let requests: any[] = [];

  if(! blacklisted_ids || blacklisted_ids.length === 0) {
    blacklisted_ids = [""];
  }


  do {
    const request = subgraphRequest(
      options.graph,
      makeQuery(snapshot, options.minter_account_id, lastUpdatedAt, blacklisted_ids)
    );
    requests.push(request);
    const response = await request;

    response.accountNFTSlots.forEach((slot) => {
      if(! balances.hasOwnProperty(slot.account.address)) {
        balances[slot.account.address] = 0;
      }
      balances[slot.account.address] += parseInt(slot.balance);
      lastUpdatedAt = slot.lastUpdatedAt;
    });
    response_size = response.accountNFTSlots.length;

  } while(response_size == LIMIT);

  await Promise.all(requests);

  return balances;
}
