import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';
import { verifyResultsLength, verifyResults } from './oceanUtils';

export const author = 'w1kke';
export const version = '0.1.0';

const OCEAN_ERC20_DECIMALS = 18;
const OCEAN_SUBGRAPH_URL = {
  '1':
    'https://v4.subgraph.mainnet.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph',
  '3':
    'https://v4.subgraph.ropsten.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph',
  '42':
    'https://v4.subgraph.rinkeby.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph',
  '56':
    'https://v4.subgraph.bsc.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph',
  '137':
    'https://v4.subgraph.polygon.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph',
  '246':
    'https://v4.subgraph.energyweb.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph',
  '1285':
    'https://v4.subgraph.moonriver.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph',
  '1287':
    'https://v4.subgraph.moonbase.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph',
  '80001':
    'https://v4.subgraph.mumbai.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph'
};

const OCEAN_ADDRESS = {
  '1': '0x967da4048cD07aB37855c090aAF366e4ce1b9F48',
  '3': '0x5e8DCB2AfA23844bcc311B00Ad1A0C30025aADE9',
  '42': '0x8967bcf84170c91b0d24d4302c2376283b0b3a07',
  '56': '0xdce07662ca8ebc241316a15b611c89711414dd1a',
  '137': '0x282d8efCe846A88B159800bd4130ad77443Fa1A1',
  '246': '0x593122aae80a6fc3183b2ac0c4ab3336debee528',
  '1285': '0x99C409E5f62E4bd2AC142f17caFb6810B8F0BAAE',
  '1287': '0xF6410bf5d773C7a41ebFf972f38e7463FA242477',
  '80001': '0xd8992Ed72C445c35Cb4A2be468568Ed1079357c8'
};

// Returns a BigDecimal as a BigNumber with 10^decimals extra zeros
export function bdToBn(bd, decimals) {
  let bn;
  const splitDecimal = bd.split('.');

  if (splitDecimal.length > 1) {
    bn = `${splitDecimal[0]}.${splitDecimal[1].slice(
      0,
      decimals - splitDecimal[0].length - 1
    )}`;
  } else {
    bn = `${splitDecimal[0]}`;
  }

  const bn2 = parseUnits(bn, decimals);
  return bn2;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const oceanToken = OCEAN_ADDRESS[network].toLowerCase();
  const params = {
    pools: {
      __args: {
        where: {
          baseToken_in: [oceanToken]
        },
        first: 1000,
        orderBy: 'baseTokenLiquidity',
        orderDirection: 'desc'
      },
      isFinalized: true,
      totalShares: true,
      baseTokenLiquidity: true,
      shares: {
        __args: {
          where: {
            user_in: addresses.map((address) => address.toLowerCase())
          },
          orderBy: 'shares',
          orderDirection: 'desc'
        },
        user: {
          id: true
        },
        shares: true
      },
      datatoken: {
        holderCount: true
      }
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    params.pools.__args.block = { number: +snapshot };
  }

  // Retrieve the top 1000 pools
  const graphResults = await subgraphRequest(
    OCEAN_SUBGRAPH_URL[network],
    params
  );

  // Get total votes, for ALL addresses, inside top 1000 pools, with a minimum of 0.0001 shares
  const score = {};
  const userAddresses: string[] = [];
  const return_score = {};

  // console.log(
  //   `graph results for network: ${options.network} at snapshot: ${snapshot}`
  // );
  // console.log('results: ', graphResults);

  if (graphResults && graphResults.pools) {
    graphResults.pools.forEach((pool) => {
      if (pool.isFinalized) {
        pool.shares.map((share) => {
          const userAddress = getAddress(share.user.id);
          // const shares = share.shares;
          // console.log(
          //   `High Level - User address: ${userAddress} user poolShares: ${shares} baseTokenLiquidity: ${pool.baseTokenLiquidity} poolTotalShares: ${pool.totalShares}`
          // );
          if (!userAddresses.includes(userAddress))
            userAddresses.push(userAddress);
          if (!score[userAddress]) score[userAddress] = BigNumber.from(0);
          const userShare =
            share.shares * (pool.baseTokenLiquidity / pool.totalShares);
          if (userShare > 0.0001) {
            score[userAddress] = score[userAddress].add(
              bdToBn(userShare.toString(), OCEAN_ERC20_DECIMALS)
            );
          }
        });
      }
    });

    // We then sum total votes, per user address
    userAddresses.forEach((address) => {
      const parsedSum = parseFloat(
        formatUnits(score[address], OCEAN_ERC20_DECIMALS)
      );
      return_score[address] = parsedSum;

      // console.log(`Score for address: ${address} is: ${return_score[address]}`);
    });
  }

  // We then filter only the addresses expected
  const results = Object.fromEntries(
    Object.entries(return_score).filter(([k]) => addresses.indexOf(k) >= 0)
  );

  // Test validation: Update examples.json w/ expectedResults to reflect LPs @ blockHeight
  // Success criteria: Address scores and length, must match expectedResults. Order not validated.
  // From GRT's graphUtils.ts => verifyResults => Scores need to match expectedResults.
  // npm run test --strategy=ocean-marketplace | grep -E 'SUCCESS|ERROR'
  if (options.expectedResults) {
    const expectedResults = {};
    Object.keys(options.expectedResults.scores).forEach(function (key) {
      expectedResults[key] = results[key];
    });

    verifyResults(
      JSON.stringify(expectedResults),
      JSON.stringify(options.expectedResults.scores),
      'Scores'
    );

    verifyResultsLength(
      Object.keys(expectedResults).length,
      Object.keys(options.expectedResults.scores).length,
      'Scores'
    );
  }

  return results || {};
}
