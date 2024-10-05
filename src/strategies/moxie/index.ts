import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller, subgraphRequest } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'Hrishikesh-Thakkar';
export const version = '0.0.1';

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
];

const MOXIE_VESTING_SUBGRAPH_URL = "https://api.studio.thegraph.com/query/88457/moxie-vesting/version/latest";
const MOXIE_PROTOCOL_SUBGRAPH_URL = "https://api.studio.thegraph.com/query/88457/moxie-protocol/version/latest";
const MOXIE_LIQUIDITY_POOL_SUBGRAPH_URL = "https://api.studio.thegraph.com/query/88457/moxie-liquidity/version/latest";
const QUERY_LIMIT = 1000;
const UNSTAKED_FAN_TOKEN_MULTIPLIER = 2;
const STAKED_FAN_TOKEN_MULTIPLIER = 3;
const MOXIE_LIQUIDITY_MULTIPLIER = 2;
const MOXIE_CONTRACT_ADDRESS = "0x8C9037D1Ef5c6D1f6816278C7AAF5491d24CD527";
const MOXIE_DECIMALS = 18;

//Strategy to Compute Voting Power for MoxieDAO
export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  //Check if the snapshot is for a specific block number or it's latest
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const addressesMap = addresses.reduce((map, address) => {
    map[getAddress(address)] = 0;
    return map;
  }, {});

  const lowercaseAddresses = Object.keys(addressesMap).map((address) =>
    address.toLowerCase()
  );

  // Once we have the addresses we need to query the subgraphs to get the vesting contract addresses
  const vestingSubgraphQuery = {
    tokenLockWallets: {
      __args: {
        where: {
          beneficiary_in: lowercaseAddresses
        }
      },
      id: true,
      beneficiary: true,
    }
  };
  //Adding block to the query if the snapshot is not latest
  if (snapshot !== 'latest') {
    vestingSubgraphQuery.tokenLockWallets.__args['block'] = { number: snapshot };
  }

  //Query the vesting subgraph to get the vesting contract addresses
  const vestingContractResponse = await subgraphRequest(MOXIE_VESTING_SUBGRAPH_URL, vestingSubgraphQuery);
  
  // Generate a map of vesting contract addresses to beneficiaries
  const addressToBeneficiaryMap = vestingContractResponse.tokenLockWallets.reduce((map, wallet) => {
    map[wallet.id.toLowerCase()] = wallet.beneficiary.toLowerCase();
    return map;
  }, {});

  // Add vesting contract addresses to the list of addresses to query
  const allAddresses = [
    ...Object.keys(addressToBeneficiaryMap),
    ...lowercaseAddresses
  ];

  // Initialise all the addresses with a score of 0
  const allAddressesScoreMap = allAddresses.reduce((map, address) => {
    map[getAddress(address)] = 0;
    return map;
  }, {});

  const protocolSubgraphQuery = {
    portfolios: {
      __args: {
        where: {
          user_in: allAddresses,
          balance_gt: 0
        },
        first: QUERY_LIMIT,
        skip: 0
      },
      unstakedBalance: true,
      stakedBalance: true,
      subjectToken: {
        currentPriceInMoxie: true
      },
      user: {
        id: true
      }
    }
  };

  const liquidityPoolSubgraphQuery = {
    userPools: {
      __args: {
        where: {
          user_in: allAddresses,
        },
        first: QUERY_LIMIT,
        skip: 0
      },
      totalLPAmount: true,
      pool: {
        totalSupply: true,
        moxieReserve: true,
      },
      user: {
        id: true
      }
    }
  };

  //Adding block to the queries if the snapshot is not latest
  if (snapshot !== 'latest') {
    protocolSubgraphQuery.portfolios.__args['block'] = { number: snapshot };
    liquidityPoolSubgraphQuery.userPools.__args['block'] = { number: snapshot };
  }

  const fetchSubgraphData = async (subgraphUrl, query, processFunction, key) => {
    let next_page = 0;
    while (true) {
      query[key].__args.skip = next_page * QUERY_LIMIT;
      const response = await subgraphRequest(subgraphUrl, query);
      const data = response[Object.keys(response)[0]];
      
      processFunction(data);

      if (data.length < QUERY_LIMIT) break;
      next_page++;
    }
  };

  const processProtocolData = (portfolios) => {
    portfolios.forEach((portfolio) => {
      const userAddress = getAddress(portfolio.user.id);
      allAddressesScoreMap[userAddress] += parseFloat(formatUnits(portfolio.unstakedBalance, MOXIE_DECIMALS)) * UNSTAKED_FAN_TOKEN_MULTIPLIER * portfolio.subjectToken.currentPriceInMoxie +
        parseFloat(formatUnits(portfolio.stakedBalance, MOXIE_DECIMALS)) * STAKED_FAN_TOKEN_MULTIPLIER * portfolio.subjectToken.currentPriceInMoxie;
    });
  };

  const processLiquidityPoolData = (userPools) => {
    userPools.forEach((userPool) => {
      const userAddress = getAddress(userPool.user.id);
      allAddressesScoreMap[userAddress] += MOXIE_LIQUIDITY_MULTIPLIER * parseFloat(formatUnits(userPool.totalLPAmount, MOXIE_DECIMALS)) *
        parseFloat(formatUnits(userPool.pool.moxieReserve, MOXIE_DECIMALS)) /
        parseFloat(formatUnits(userPool.pool.totalSupply, MOXIE_DECIMALS));
    });
  };
  
  // RPC Call to get balance of Moxie at a block for users
  const fetchBalances = async () => {
    const multi = new Multicaller(network, provider, abi, { blockTag });
    allAddresses.forEach((address) =>
      multi.call(address, MOXIE_CONTRACT_ADDRESS, 'balanceOf', [address])
    );
    const result: Record<string, BigNumberish> = await multi.execute();
    Object.entries(result).forEach(([address, balance]) => {
      let formattedBalance = parseFloat(formatUnits(balance, MOXIE_DECIMALS));
      allAddressesScoreMap[getAddress(address)] += formattedBalance;
    });
  };

  // Fetch data from both subgraphs in parallel
  await Promise.all([
    fetchSubgraphData(MOXIE_PROTOCOL_SUBGRAPH_URL, protocolSubgraphQuery, processProtocolData, "portfolios"),
    fetchSubgraphData(MOXIE_LIQUIDITY_POOL_SUBGRAPH_URL, liquidityPoolSubgraphQuery, processLiquidityPoolData, "userPools"),
    fetchBalances(),
  ]);

  // Now we have the score for each address we need to ensure it is added to the beneficiary address if it exists
  Object.keys(allAddressesScoreMap).forEach((address) => {
    const beneficiary = addressToBeneficiaryMap[address.toLowerCase()];
    if (beneficiary) {
      addressesMap[getAddress(beneficiary)] += allAddressesScoreMap[address];
    } else {
      addressesMap[address] += allAddressesScoreMap[address];
    }
  });

  return addressesMap;
}