import { BigNumber } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';

export const author = 'bark4mark';
export const version = '0.1.0';

const MAX_CONTRACTS = 8;

enum ContractType {
  NFT = 'NFT',
  TokenInfusedNFT = 'TokenInfusedNFT'
}

type ContractDetails = {
  address: string;
  token: string;
  decimal: number;
  contractType: ContractType;
  lockedTokenMultiplier: number;
  lockedTokenMonthlyMultiplier: any;
};

const abis = {
  NFT: [
    'function balanceOf(address owner) external view returns (uint256 balance)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId)',
    'function futures(uint256 index) external view returns (uint256 amount, address token, uint256 unlockDate)',
    'function token() external view returns (address token)'
  ],
  TokenInfusedNFT: [
    'function futures(uint256 index) external view returns (uint256 amount, uint256 unlockDate)'
  ]
};

const compareAddresses = (address1: string, address2: string): boolean => {
  if (!address1 || !address2) return false;
  return address1.toLowerCase() === address2.toLowerCase();
};

const getMonthDifference = (start: Date, end: Date): number => {
  return (
    end.getMonth() -
    start.getMonth() +
    12 * (end.getFullYear() - start.getFullYear())
  );
};

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const contractDetails: ContractDetails[] = options.contracts;
  if (contractDetails.length > MAX_CONTRACTS) {
    throw new Error(`Max number (${MAX_CONTRACTS}) of contracts exceeded`);
  }
  const balanceOfMulti = new Multicaller(network, provider, abis.NFT, {
    blockTag
  });

  contractDetails.forEach((contractDetail) => {
    addresses.forEach((address: string) => {
      balanceOfMulti.call(
        `${contractDetail.address}/${address}`,
        contractDetail.address,
        'balanceOf',
        [address]
      );
    });
    if (contractDetail.contractType === ContractType.TokenInfusedNFT) {
      balanceOfMulti.call(
        `${contractDetail.address}/token`,
        contractDetail.address,
        'token'
      );
    }
  });

  const balanceOfResult = await balanceOfMulti.execute();
  const nftHolderMulti = new Multicaller(network, provider, abis.NFT, {
    blockTag
  });

  contractDetails.forEach((contractDetail) => {
    addresses.forEach((address: string) => {
      const balance = balanceOfResult[`${contractDetail.address}/${address}`];
      for (let index = 0; index < balance; index++) {
        nftHolderMulti.call(
          `${contractDetail.contractType}/${contractDetail.address}/${address}/${index}`,
          contractDetail.address,
          'tokenOfOwnerByIndex',
          [address, index]
        );
      }
    });
  });

  const nftHolders = await nftHolderMulti.execute();

  const nftDealsMulti = new Multicaller(network, provider, abis.NFT, {
    blockTag
  });

  const tiNFTDealsMulti = new Multicaller(
    network,
    provider,
    abis.TokenInfusedNFT,
    { blockTag }
  );

  for (const [path, nftId] of Object.entries(nftHolders)) {
    const [contractType, contractAddress, address] = path.split('/');
    switch (contractType) {
      case ContractType.NFT:
        nftDealsMulti.call(
          `${contractAddress}/${address}`,
          contractAddress,
          'futures',
          [nftId]
        );
        break;
      case ContractType.TokenInfusedNFT:
        tiNFTDealsMulti.call(
          `${contractAddress}/${address}`,
          contractAddress,
          'futures',
          [nftId]
        );
        break;
    }
  }

  const nftDeals = await nftDealsMulti.execute();
  const tiNFTDeals = await tiNFTDealsMulti.execute();

  const votes = {};

  for (const [path, deal] of Object.entries<any>(nftDeals)) {
    const [contractAddress, address] = path.split('/');
    const contractDetail = contractDetails.find(
      (element) => element.address === contractAddress
    );

    if (!contractDetail) continue;
    if (!compareAddresses(deal.token, contractDetail.token)) continue;

    const amount = BigNumber.from(deal.amount).div(
      BigNumber.from(10).pow(contractDetail.decimal)
    );

    let score = amount.toNumber();
    score = score * contractDetail.lockedTokenMultiplier;
    const durationStart = new Date();
    const unlockDate = new Date(deal.unlockDate * 1000);

    const months = getMonthDifference(durationStart, unlockDate);
    let monthlyMultiplier = contractDetail.lockedTokenMonthlyMultiplier[months];

    if (!monthlyMultiplier)
      monthlyMultiplier =
        contractDetail.lockedTokenMonthlyMultiplier['default'];

    score = score * monthlyMultiplier;

    let existingAmount = votes[address];
    if (existingAmount) {
      existingAmount = existingAmount + score;
    } else {
      votes[address] = score;
    }
  }

  for (const [path, deal] of Object.entries<any>(tiNFTDeals)) {
    const [contractAddress, address] = path.split('/');
    const contractDetail = contractDetails.find(
      (element) => element.address === contractAddress
    );

    if (!contractDetail) continue;

    const contractToken = balanceOfResult[`${contractDetail.address}/token`];
    if (!compareAddresses(contractToken, contractDetail.token)) continue;

    const amount = BigNumber.from(deal.amount).div(
      BigNumber.from(10).pow(contractDetail.decimal)
    );

    let score = amount.toNumber();
    score = score * contractDetail.lockedTokenMultiplier;
    const durationStart = new Date();
    const unlockDate = new Date(deal.unlockDate * 1000);

    const months = getMonthDifference(durationStart, unlockDate);
    if (months > 1) {
      let monthlyMultiplier =
        contractDetail.lockedTokenMonthlyMultiplier[months];

      if (!monthlyMultiplier)
        monthlyMultiplier =
          contractDetail.lockedTokenMonthlyMultiplier['default'];

      score = score * monthlyMultiplier;
    }
    let existingAmount = votes[address];
    if (existingAmount) {
      existingAmount = existingAmount + score;
    } else {
      votes[address] = score;
    }
  }

  return votes;
}
