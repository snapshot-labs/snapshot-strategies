import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

// add some information required
export const author = 'andreibadea20'; 
export const version = '0.1.0';   
const DPS_SUBGRAPH_URL = {
  '80001': 'https://api.thegraph.com/subgraphs/name/andreibadea20/subgraph-dps'
};

const PAGE_SIZE = 1000;

// first params to fetch informations about users
const params = {
  users: {
    __args: {
      first: PAGE_SIZE,
      skip: 0
    },
    id: true,
    numberOfTokens: true
    }
};

// second params to fetch informations about nfts
const paramsForNFTs = {
  nftlockeds: {
    tokenId: true,
    owner: {
      id: true
    },
    transferedAtTimestamp: true
  },
  nftafterClaimeds: {
    tokenId: true,
    owner: {
      id: true
    },
    transferedAtTimestamp: true
  }
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {

  // fetch informations using sugraphRequest
  const resultNFTs = await subgraphRequest(DPS_SUBGRAPH_URL[network], paramsForNFTs);

  const score = {};

  let page = 0;
  while(page !== -1) {
    params.users.__args.skip = page * PAGE_SIZE;

    const result = await subgraphRequest(DPS_SUBGRAPH_URL[network], params);
   
    if (result && result.users && resultNFTs && resultNFTs.nftlockeds && resultNFTs.nftafterClaimeds) {
      result.users.forEach((u) => {
        let userScore = parseInt(u.numberOfTokens);
        let lockedNFTs = 0;
        let claimedNFTs = 0;
        const userAddress = getAddress(u.id);

        resultNFTs.nftlockeds.forEach((n) => {
          if(n.owner.id === u.id) {
            lockedNFTs = lockedNFTs + 1;
          }
        });

        resultNFTs.nftafterClaimeds.forEach((nft) => {
          if(nft.owner.id === u.id) {
            claimedNFTs = claimedNFTs + 1;
          }
        });
        
        userScore = userScore + lockedNFTs - claimedNFTs;
      
        if (!score[userAddress]) 
          score[userAddress] = 0;

        score[userAddress] = userScore;
      });

        // we use pagination
        page = result.users.length < PAGE_SIZE ? -1 : page + 1;
    } else {
      page = -1;
    }
  }

  return score || {};
}