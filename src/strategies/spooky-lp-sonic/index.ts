import { subgraphRequest } from '../../utils';
import { getAddress } from '@ethersproject/address';

const MY_SUBGRAPH_URL = {
  '146': 'https://api.0xgraph.xyz/api/public/28820bd2-ad8b-4d40-a142-ce8d7c786f66/subgraphs/spookyswap/v3/v0.0.1/gn'
};

export const author = '0xaaiden';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const poolIds = [
    "0x686d873a9e0696afaca0bc163dcc95b577d9e3e8",
    "0xf4dcfaa2711908a8c61d9516d84b24ffdae241db",
    "0xb7228a39cdd2c734064fc95c54e75910ff06eed6",
    "0x84d4716c1cf4d7b1b1c247ad69b62fa72ccc46d7",
    "0xaa4ee51f55f9baa7cf180fbaf2688cc35fdc8012"
    ];

  const subgraphURL = MY_SUBGRAPH_URL[network];
  const score = {};
  addresses.forEach((address) => {
    score[getAddress(address)] = 0;
  });

  for (const poolId of poolIds) {
    const params = {
      mints: {
        __args: {
          where: {
            pool_: { id: poolId },
            origin_in: addresses.map((address) => address.toLowerCase())
          }
        },
        origin: true,
        timestamp: true,
        amount: true,
        pool: { id: true }
      },
      burns: {
        __args: {
          where: {
            pool_: { id: poolId },
            origin_in: addresses.map((address) => address.toLowerCase())
          }
        },
        origin: true,
        timestamp: true,
        amount: true,
        pool: { id: true }
      }
    };

    if (snapshot !== 'latest') {
      // @ts-ignore
      params.mints.__args.where.transaction_ = { blockNumber_lte: snapshot };
      // @ts-ignore
      params.burns.__args.where.transaction_ = { blockNumber_lte: snapshot };
    }

    const result = await subgraphRequest(subgraphURL, params);
    if (result && (result.mints || result.burns)) {
      const mints = result.mints;
      const burns = result.burns;

      mints.forEach((mint) => {
        const userAddress = getAddress(mint.origin);
        const amount = parseFloat(mint.amount);
        score[userAddress] += amount/10**19;
      });

      burns.forEach((burn) => {
        const userAddress = getAddress(burn.origin);
        const amount = parseFloat(burn.amount);
        score[userAddress] -= amount/10**19;
      });
    }
  }

  return score || {};
}
