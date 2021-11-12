import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

const FUNDING_SUBGRAPH_URL = {
  '4': 'https://api.studio.thegraph.com/query/9578/funding-subgraph-v5/v0.0.1' // Rinkeby testnet
};

export const author = 'AmirSarraf';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  let params = {};
  const fundingProject = options.fundingProject;
  const mainField: string = fundingProject ? 'fundingProjects' : 'nfts';

  if (fundingProject) {
    // parameters to query nfts belonging to the provided addresses in a certain fundingProject
    params = {
      fundingProjects: {
        __args: {
          id: fundingProject.toLowerCase()
        },
        id: true,
        nfts: {
          __args: {
            where: {
              nftReceiver_in: addresses.map((address) => address.toLowerCase())
            }
          },
          amtPerSec: true,
          nftReceiver: true
        }
      }
    };
  } else {
    // parameters to query nfts belonging to the provided addresses
    params = {
      nfts: {
        __args: {
          where: {
            nftReceiver_in: addresses.map((address) => address.toLowerCase())
          },
          first: 1000
        },
        amtPerSec: true,
        nftReceiver: true
      }
    };
  }

  if (snapshot !== 'latest') {
    // @ts-ignore
    params[mainField].__args.block = { number: snapshot };
  }

  let result = await subgraphRequest(FUNDING_SUBGRAPH_URL[network], params);
  result = fundingProject
    ? result?.fundingProjects?.find((proj) => proj.id == fundingProject) //double checking id
    : result;

  const score: Record<string, BigNumber> = {};
  if (result && result.nfts) {
    result.nfts.forEach((nft) => {
      const userAddress = getAddress(nft.nftReceiver);
      const userScore = nft.amtPerSec;
      if (!score[userAddress]) score[userAddress] = BigNumber.from(0);
      score[userAddress] = score[userAddress].add(BigNumber.from(userScore));
    });
  }

  return Object.fromEntries(
    Object.entries(score).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance.toString(), options.decimals))
    ])
  );
}
