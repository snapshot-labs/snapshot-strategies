import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = 'andreibadea20';
export const version = '0.3.1';

const DPS_SUBGRAPH_URL_MOONBEAM = {
  '1284':
    'https://api.thegraph.com/subgraphs/name/andreibadea20/dps-holders-moonbeam'
};

const PAGE_SIZE = 1000;

const params = {
  holders: {
    __args: {
      block: { number: 2847359 },
      first: PAGE_SIZE,
      skip: 0
    },
    id: true,
    listOfDPSOwned: true,
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
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.holders.__args.block = { number: snapshot };
  }

  const score = {};
  let page = 0;

  while (page !== -1) {
    params.holders.__args.skip = page * PAGE_SIZE;

    const result = await subgraphRequest(
      DPS_SUBGRAPH_URL_MOONBEAM[network],
      params
    );

    if (result && result.holders) {
      result.holders.forEach(
        (holder: {
          id: string;
          listOfDPSOwned: string;
          listOfDPSLocked: string | any[];
          listOfDPSReturned: string | any[];
        }) => {
          const userAddress = getAddress(holder.id);

          let userScore = holder.listOfDPSOwned.length;

          const lockedNFTs = holder.listOfDPSLocked.length;
          const claimedNFTs = holder.listOfDPSReturned.length;

          userScore = userScore + lockedNFTs - claimedNFTs;

          if (!score[userAddress]) score[userAddress] = 0;
          score[userAddress] = 3 * userScore;
        }
      );
      page = result.holders.length < PAGE_SIZE ? -1 : page + 1;
    } else {
      page = -1;
    }
  }

  return score || {};
}
