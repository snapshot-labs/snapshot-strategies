export type Scores = {
  [address: string]: number;
};

export type RentalsLandOrEstate = {
  id: string;
  contractAddress: string;
  tokenId: string;
  lessor: string;
};

export type MarketplaceEstate = {
  tokenId: string;
  size: number;
};
