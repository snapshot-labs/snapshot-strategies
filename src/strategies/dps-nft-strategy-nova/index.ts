import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = 'andreibadea20';
export const version = '0.1.0';

const DPS_SUBGRAPH_URL_NOVA = {
  '42170':
    'https://api.goldsky.com/api/public/project_clg4w9cwqdk8c3rz73mqr0z91/subgraphs/voting-subgraph/1.0.0/gn'
};

const PAGE_SIZE = 1000;

const params_nova = {
  holders: {
    __args: {
      block: { number: 927357 },
      first: PAGE_SIZE,
      skip: 0
    },
    id: true,
    numberOfDPSOwned: true,
    listOfDPSLocked: {
      tokenId: true
    },
    listOfDPSReturned: {
      tokenId: true
    }
  }
};

export async function strategy(
  space: any,
  network: string | number,
  provider: any,
  addresses: any,
  options: any,
  snapshot: string
) {
  //calculate score for moonbeam
  const score = {};

  // calculate score for nova
  if (snapshot !== 'latest') {
    // @ts-ignore
    params_nova.holders.__args.block = { number: snapshot };
  }

  // eslint-disable-next-line prefer-const
  let page_nova = 0;

  while (page_nova !== -1) {
    params_nova.holders.__args.skip = page_nova * PAGE_SIZE;

    const result = await subgraphRequest(
      DPS_SUBGRAPH_URL_NOVA[network],
      params_nova
    );

    if (result && result.holders) {
      result.holders.forEach(
        (holder: {
          id: string;
          numberOfDPSOwned: string;
          listOfDPSLocked: string | any[];
          listOfDPSReturned: string | any[];
        }) => {
          const userAddress = getAddress(holder.id);

          let userScore = Number(holder.numberOfDPSOwned);

          const lockedNFTs = holder.listOfDPSLocked.length;
          const claimedNFTs = holder.listOfDPSReturned.length;

          userScore = userScore + lockedNFTs - claimedNFTs;

          if (!score[userAddress]) score[userAddress] = 0;
          score[userAddress] = userScore;
        }
      );
      page_nova = result.holders.length < PAGE_SIZE ? -1 : page_nova + 1;
    } else {
      page_nova = -1;
    }
  }

  return score || {};
}
