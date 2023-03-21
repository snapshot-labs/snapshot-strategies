// Original code by Karamorf, upgraded by Raecaug(system32)
// Allows querys of Loopring L2 accounts & balances by specifying a nft minter, token contract address(and optionally specifying individual ids to white/blacklist)

import { subgraphRequest } from '../../utils';
export const author = 'raecaug';
export const version = '0.1.0';

const LIMIT = 1000;

function makeQuery(
  snapshot, // This is an Ethereum block # or defaults to 'latest'
  minter, // This is referred to as account # or account id on the Loopring L2 block explorer
  tokens, // NFT collection contract addresses, also referred to as 'token address'
  skip, // Used to skip response lines in requests
  blacklisted_account_ids, // Ditto properties of 'minter'
  blacklisted_nft_ids, // This is the nft id, which is unique for every nft ever minted, allows distinction between nfts in a collection at the chain level
  nft_ids // Ditto properties of blacklisted version
) {
  const query: any = {
    // Query constructor, builds request with params from snapshot space settings
    accountNFTSlots: {
      __args: {
        where: {
          nft_: {
            id_not_in: blacklisted_nft_ids, // Excluding blacklisted nft ids
            nftID_in: nft_ids // Including uniquely specified nft ids
          },
          account_not_in: blacklisted_account_ids // Excluding blacklisted account ids
        },
        first: LIMIT,
        skip: skip
      },
      account: { address: true },
      balance: true
    }
  };

  if (minter && minter !== '') {
    //Check to ensure minter id is specified and not blank
    query.accountNFTSlots.__args.where.nft_.minter = minter;
  }

  if (tokens && tokens.length > 0) {
    //Check to ensure at least 1 token to search for is specified
    query.accountNFTSlots.__args.where.nft_.token_in = tokens;
  }

  if (snapshot !== 'latest') {
    // If the snapshot date is manually specified, overwrite the 'latest' block, strict inequality check operand used
    query.accountNFTSlots.__args = {
      ...query.accountNFTSlots.__args,
      block: {
        number: snapshot
      }
    };
  }

  return query;
}

export async function strategy( // *****Logical execution begins here; args passed in by Snapshot settings*****
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  let blacklisted_account_ids = options.blacklisted_account_ids;
  let blacklisted_nft_ids = options.blacklisted_nft_ids;

  const multiplier = options.multiplier; // Multiplier to be applied against returned NFT amounts

  let nft_ids = options.nft_ids; // Unique NFT ids, distinguishable from 1155 token contracts

  const balances = {}; // Initialization
  let skip = 0;
  let response_size = 0;

  if (!blacklisted_account_ids || blacklisted_account_ids.length === 0) {
    // If no blacklisted accts specified, set to empty
    blacklisted_account_ids = [''];
  }

  if (!blacklisted_nft_ids || blacklisted_nft_ids.length === 0) {
    // If no unique nft_ids specified, set to empty
    blacklisted_nft_ids = [''];
  }

  if (!nft_ids || nft_ids.length === 0) {
    // If no unique nft_ids specified, set to empty
    nft_ids = [''];
  }

  do {
    // Transmit query and await results
    const response = await subgraphRequest(
      // Constructs response variable from subgraph query function
      options.graph, // Parameter 1, options specified
      makeQuery(
        // Query constructor(defined above) called, results are the second parameter
        snapshot,
        options.minter_account_id,
        options.tokens,
        skip,
        blacklisted_account_ids,
        blacklisted_nft_ids,
        nft_ids
      )
    );

    response.accountNFTSlots.forEach((slot) => {
      // Checking against each accountNFTSlot element
      if (!balances.hasOwnProperty(slot.account.address)) {
        balances[slot.account.address] = 0; // If nothing returned, set this accounts balance to 0
      }
      balances[slot.account.address] += multiplier * parseInt(slot.balance); // Otherwise, a bigint is returned; parse it, apply multiplier and store in balances array
    });
    response_size = response.accountNFTSlots.length; // Value is set to 0 on loop entry, updated here, will break loop for anything other than 1000
    skip += response_size;
  } while (response_size == LIMIT);

  const scores = Object.fromEntries(
    addresses.map((address) => [address, balances[address.toLowerCase()]]) // Map returned addresses and balances as scores array
  );

  return scores; // Returns addresses and balances to Snapshot
}
