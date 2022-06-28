import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = 'andreibadea20';
export const version = '0.1.0';

const DPS_SUBGRAPH_URL = {
  '80001': 'https://api.thegraph.com/subgraphs/name/andreibadea20/subgraph-dps'
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {

  const params = {
    users: {
      __args: {
        where: {
          id_in: addresses.map((address) => address.toLowerCase())
        },
        first: 1000
      },
      id: true,
      numberOfTokens: true
      }
  };
      
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

  const result = await subgraphRequest(DPS_SUBGRAPH_URL[network], params);
  const score = {};
  const resultNFTs = await subgraphRequest(DPS_SUBGRAPH_URL[network], paramsForNFTs);

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
  }

  return score;
}