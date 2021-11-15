import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { subgraphRequest } from '../../utils';

export const author = 'vatsalgupta13';
export const version = '0.1.0';

const DFYN_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/ss-sonic/dfyn-v5';

const getAllLP = async (skip, stakedLP, snapshot) => {
  const params = {
    pairs: {
      __args: {
        where: {
          id_in: stakedLP.map((address) => address.toLowerCase())
        },
        skip: skip,
        first: 1000
      },
      id: true,
      reserve0: true,
      reserve1: true,
      totalSupply: true,
      token0: {
        id: true,
        symbol: true
      },
      token1: {
        id: true,
        symbol: true
      }
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.pairs.__args.block = { number: snapshot };
  }
  try {
    const response = await subgraphRequest(DFYN_SUBGRAPH_URL, params);
    return response.pairs;
  } catch (error) {
    console.error(error);
  }
};

const getLP = async (stakedLP, snapshot) => {
  let lp = [];
  let results = [];
  do {
    results = await getAllLP(lp.length, stakedLP, snapshot);
    lp = lp.concat(results);
  } while (results.length === 1000);
  return lp;
};

function chunk(array, chunkSize) {
  const tempArray: any[] = [];
  for (let i = 0, len = array.length; i < len; i += chunkSize)
    tempArray.push(array.slice(i, i + chunkSize));
  return tempArray;
}

function calcTokenBalance(
  user_lp_balance,
  total_lp_supply,
  total_token_reserve
) {
  return total_lp_supply === 0
    ? 0
    : (total_token_reserve / total_lp_supply) * user_lp_balance;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  let callData: [any, string, [any]][] = [];
  const callStakedAddress: [any, string][] = [];
  options.contractAddresses.map((contractAddress: any) => {
    callStakedAddress.push([contractAddress, options.methodABI_2.name]);
  });
  addresses.map((userAddress: any) => {
    options.contractAddresses.map((contractAddress: any) => {
      callData.push([contractAddress, options.methodABI_1.name, [userAddress]]);
    });
  });
  callData = [...chunk(callData, 2000)]; // chunking the callData into multiple arrays of 2000 requests

  let LP_balances: any[] = [];
  for (let i = 0; i < callData.length; i++) {
    const tempArray = await multicall(
      network,
      provider,
      [options.methodABI_1],
      callData[i],
      { blockTag }
    );
    LP_balances.push(...tempArray);
  }

  let stakedLP = await multicall(
    network,
    provider,
    [options.methodABI_2],
    callStakedAddress,
    { blockTag }
  );

  stakedLP = [].concat.apply([], stakedLP);
  const dfyn_lp: any[] = await getLP(stakedLP, snapshot);
  let temp: any = [];
  if (options.contractAddresses.length > 1) {
    // sorting dfyn_lp such that it aligns with users' lp balances
    const itemPositions = {};
    for (let i = 0; i < stakedLP.length; i++) {
      itemPositions[stakedLP[i].toLowerCase()] = i;
    }
    dfyn_lp.sort((a, b) => itemPositions[a.id] - itemPositions[b.id]);

    // grouping all balances of a particular address together
    LP_balances = [].concat.apply([], LP_balances);
    for (let i = addresses.length; i > 0; i--) {
      temp.push(LP_balances.splice(0, Math.ceil(LP_balances.length / i)));
    }
  } else {
    temp = [...LP_balances];
  }

  // finding users token balance from their lp balances
  LP_balances = [];
  temp.map((item, index) => {
    let sum = 0;
    temp[index].map((element, i) => {
      element = calcTokenBalance(
        parseFloat(formatUnits(element.toString(), 18)),
        parseFloat(dfyn_lp[i].totalSupply),
        options.tokenAddress.toLowerCase() === dfyn_lp[i].token0.id
          ? parseFloat(dfyn_lp[i].reserve0)
          : parseFloat(dfyn_lp[i].reserve1)
      );
      sum = sum + element;
    });
    LP_balances.push(sum);
  });

  return Object.fromEntries(
    LP_balances.map((value, i) => [
      addresses[i],
      options.scoreMultiplier * value
    ])
  );
}
