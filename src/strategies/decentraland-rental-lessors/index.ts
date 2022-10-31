import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';
import { MarketplaceEstate, RentalsLandOrEstate, Scores } from './types';

export const author = 'fzavalia';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const scores: Scores = {};

  // Initialize scores for every provided address as 0
  for (const address of addresses) {
    scores[getAddress(address)] = 0;
  }

  // For the provided addresses, fetch all their Lands and Estates that have been locked in the rentals contract.
  const rentalLandsAndEstates = await fetchLandsAndEstatesInRentalsContract(
    addresses,
    options,
    snapshot
  );

  const rentalLands: RentalsLandOrEstate[] = [];
  const rentalEstates: RentalsLandOrEstate[] = [];

  // Separate the assets into Lands and Estates
  for (const rentalLandOrEstate of rentalLandsAndEstates) {
    switch (rentalLandOrEstate.contractAddress) {
      case options.addresses.land.toLowerCase():
        rentalLands.push(rentalLandOrEstate);
        break;
      case options.addresses.estate.toLowerCase():
        rentalEstates.push(rentalLandOrEstate);
        break;
      default:
        console.log('Not a Land nor an Estate');
    }
  }

  // For each Land, increase the score of the original owner by the land multiplier.
  for (const land of rentalLands) {
    scores[getAddress(land.lessor)] += options.multipliers.land;
  }

  // Fill the estateSize prop on locked estates.
  const rentalAndMarketplaceEstates =
    await fetchMarketplaceEstatesForProvidedRentalAssets(
      rentalEstates,
      options,
      snapshot
    );

  // For each Estate, increase the score of the original owner by the size of the estate times the multiplier.
  for (const [rentalEstate, marketplaceEstate] of rentalAndMarketplaceEstates) {
    scores[getAddress(rentalEstate.lessor)] +=
      marketplaceEstate.size * options.multipliers.estateSize;
  }

  return scores;
}

// For a given list of addresses, fetch all the lands and estates that belonged to them before being transferred to the Rentals contract.
async function fetchLandsAndEstatesInRentalsContract(
  addresses,
  options,
  snapshot
): Promise<RentalsLandOrEstate[]> {
  const query: any = {
    rentalAssets: {
      __args: {
        where: {
          contractAddress_in: [
            options.addresses.estate.toLowerCase(),
            options.addresses.land.toLowerCase()
          ],
          lessor_in: addresses.map((address) => address.toLowerCase()),
          isClaimed: false
        },
        first: 1000,
        skip: 0
      },
      id: true,
      contractAddress: true,
      tokenId: true,
      lessor: true
    }
  };

  // If a snapshot is provided, use it as another filter of the query.
  if (typeof snapshot === 'number') {
    query.rentalAssets.__args.block = { number: snapshot };
  }

  let finalRentalLandsAndEstates: RentalsLandOrEstate[] = [];

  let hasMoreResults = true;

  while (hasMoreResults) {
    const result = await subgraphRequest(options.subgraphs.rentals, query);

    const rentalLandsAndEstates: RentalsLandOrEstate[] = result.rentalAssets;

    // If the received length matches the requested length, there might be more results.
    hasMoreResults =
      rentalLandsAndEstates.length === query.rentalAssets.__args.first;
    // If there are more results, skip the ones we already have on the next query.
    query.rentalAssets.__args.skip += query.rentalAssets.__args.first;

    finalRentalLandsAndEstates = [
      ...finalRentalLandsAndEstates,
      ...rentalLandsAndEstates
    ];
  }

  return finalRentalLandsAndEstates;
}

// For a given list of estates obtained from the rentals subgraph, fetch the estates that correspond to them in the marketplace subgraph.
async function fetchMarketplaceEstatesForProvidedRentalAssets(
  rentalEstates: RentalsLandOrEstate[],
  options,
  snapshot
): Promise<[RentalsLandOrEstate, MarketplaceEstate][]> {
  const rentalEstatesTokenIds: string[] = [];

  // Keep a map of rental estates to optimize the lookup later.
  const rentalEstatesByTokenId = new Map<string, RentalsLandOrEstate>();

  for (const rentalEstate of rentalEstates) {
    const tokenId = rentalEstate.tokenId;
    rentalEstatesTokenIds.push(tokenId);
    rentalEstatesByTokenId.set(tokenId, rentalEstate);
  }

  const query: any = {
    estates: {
      __args: {
        where: {
          tokenId_in: rentalEstatesTokenIds,
          size_gt: 0
        },
        first: 1000,
        skip: 0
      },
      tokenId: true,
      size: true
    }
  };

  // If a snapshot is provided, use it as another filter of the query.
  if (typeof snapshot === 'number') {
    query.estates.__args.block = { number: snapshot };
  }

  const rentalAndMarketplaceEstates: [
    RentalsLandOrEstate,
    MarketplaceEstate
  ][] = [];

  let hasMoreResults = true;

  while (hasMoreResults) {
    const result = await subgraphRequest(options.subgraphs.marketplace, query);

    const marketplaceEstates: MarketplaceEstate[] = result.estates;

    // If the received length matches the requested length, there might be more results.
    hasMoreResults = marketplaceEstates.length === query.estates.__args.first;
    // If there are more results, skip the ones we already have on the next query.
    query.estates.__args.skip += query.estates.__args.first;

    for (const marketplaceEstate of marketplaceEstates) {
      const rentalEstate = rentalEstatesByTokenId.get(
        marketplaceEstate.tokenId
      );

      if (rentalEstate) {
        rentalAndMarketplaceEstates.push([rentalEstate, marketplaceEstate]);
      }
    }
  }

  return rentalAndMarketplaceEstates;
}
