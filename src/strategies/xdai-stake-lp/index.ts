import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import { multicall, subgraphRequest } from '../../utils';

export const author = 'maxaleks';
export const version = '0.1.0';

const STAKE_TOKEN_ADDRESS = '0x0Ae055097C6d159879521C384F1D2123D1f195e6';
const DECIMALS = 18;
const SUSHISWAP_MASTER_CHEF_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/sushiswap/master-chef';

const exchanges = {
  uniswap: {
    lpTokenAddress: '0x3B3d4EeFDc603b232907a7f3d0Ed1Eea5C62b5f7',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2'
  },
  sushiswap: {
    lpTokenAddress: '0x9Fc5b87b74B9BD239879491056752EB90188106D',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/sushiswap/exchange'
  }
};

const abi = ['function balanceOf(address owner) view returns (uint256)'];

async function getSushiswapLpBalances(options, snapshot, addresses) {
  const params = {
    users: {
      __args: {
        where: {
          pool: '49',
          address_in: addresses.map((addr) => addr.toLowerCase())
        }
      },
      address: true,
      amount: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.users.__args.block = { number: snapshot };
  }
  return subgraphRequest(
    options.sushiswapMasterChefSubgraphUrl ||
      SUSHISWAP_MASTER_CHEF_SUBGRAPH_URL,
    params
  );
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
  const lpTokenAddress = (
    options.lpTokenAddress || exchanges[options.exchange].lpTokenAddress
  ).toLowerCase();
  const subgraphUrl =
    options.subgraphUrl || exchanges[options.exchange].subgraphUrl;

  let rate;

  const params = {
    pairs: {
      __args: {
        where: {
          id: lpTokenAddress
        }
      },
      id: true,
      totalSupply: true,
      reserve0: true,
      reserve1: true,
      token0: {
        id: true
      },
      token1: {
        id: true
      }
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.pairs.__args.block = { number: snapshot };
  }

  const result = await subgraphRequest(subgraphUrl, params);

  if (result && result.pairs) {
    result.pairs.map((object) => {
      rate =
        object.token0.id == STAKE_TOKEN_ADDRESS.toLowerCase()
          ? +object.reserve0 / +object.totalSupply
          : +object.reserve1 / +object.totalSupply;
    }, []);
  }

  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [lpTokenAddress, 'balanceOf', [address]]),
    { blockTag }
  );
  const balances = Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), DECIMALS)) * rate
    ])
  );

  if (options.exchange === 'sushiswap') {
    const response = await getSushiswapLpBalances(options, snapshot, addresses);
    response.users.forEach(({ address, amount }) => {
      const checksumAddress = getAddress(address);
      balances[checksumAddress] +=
        parseFloat(formatUnits(amount, DECIMALS)) * rate;
    });
  }

  return balances;
}
