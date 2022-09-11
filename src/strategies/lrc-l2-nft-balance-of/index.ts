import { subgraphRequest } from '../../utils';
export const author = 'karamorf';
export const version = '0.1.1';

const LIMIT = 1000;

function makeQuery(
  snapshot,
  minter,
  tokens,
  skip,
  blacklisted_account_ids,
  blacklisted_nft_ids
) {
  const query: any = {
    accountNFTSlots: {
      __args: {
        where: {
          nft_: {
            id_not_in: blacklisted_nft_ids
          },
          account_not_in: blacklisted_account_ids
        },
        first: LIMIT,
        skip: skip
      },
      account: { address: true },
      balance: true
    }
  };

  if (minter && minter !== '') {
    query.accountNFTSlots.__args.where.nft_.minter = minter;
  }

  if (tokens && tokens.length > 0) {
    query.accountNFTSlots.__args.where.nft_.token_in = tokens;
  }

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
  let blacklisted_account_ids = options.blacklisted_account_ids;
  let blacklisted_nft_ids = options.blacklisted_nft_ids;
  const balances = {};
  let skip = 0;
  let response_size = 0;

  if (!blacklisted_account_ids || blacklisted_account_ids.length === 0) {
    blacklisted_account_ids = [''];
  }

  if (!blacklisted_nft_ids || blacklisted_nft_ids.length === 0) {
    blacklisted_nft_ids = [''];
  }

  do {
    const response = await subgraphRequest(
      options.graph,
      makeQuery(
        snapshot,
        options.minter_account_id,
        options.tokens,
        skip,
        blacklisted_account_ids,
        blacklisted_nft_ids
      )
    );

    response.accountNFTSlots.forEach((slot) => {
      if (!balances.hasOwnProperty(slot.account.address)) {
        balances[slot.account.address] = 0;
      }
      balances[slot.account.address] += parseInt(slot.balance);
    });
    response_size = response.accountNFTSlots.length;
    skip += response_size;
  } while (response_size == LIMIT);

  const scores = Object.fromEntries(
    addresses.map((address) => [address, balances[address.toLowerCase()]])
  );

  return scores;
}
