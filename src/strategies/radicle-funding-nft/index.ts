import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

const FUNDING_SUBGRAPH_URL = {
  '1': 'https://api.studio.thegraph.com/query/9578/funding-subgraph-v4/v0.0.2'
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const params = {
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

  if (snapshot !== 'latest') {
    // @ts-ignore
    params.nfts.__args.block = { number: snapshot };
  }

  const result = await subgraphRequest(FUNDING_SUBGRAPH_URL[network], params);
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
