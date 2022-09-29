import { subgraphRequest } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';
import { getAddress } from '@ethersproject/address';
import { parseUnits, formatUnits } from '@ethersproject/units';

export const author = 'pkretzschmar';
export const version = '0.1.0';

const GIVETH_SUBGRAPH_API =
  'https://api.thegraph.com/subgraphs/name/giveth/giveth-economy-mainnet';

const BALANCER_SUBGRAPH_API =
  'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2';

const poolParams = {
  pool: {
    __args: {
      id: '0x7819f1532c49388106f7762328c51ee70edd134c000200000000000000000109'
    },
    tokens: {
      balance: true,
      symbol: true
    },
    totalShares: true
  }
};

const params = {
  balances: {
    __args: {
      orderBy: 'id',
      orderDirection: 'asc',
      where: {
        id_in: []
      }
    },
    id: true,
    balance: true,
    givStaked: true,
    balancerLp: true,
    balancerLpStaked: true
  }
};

const formatReserveBalance = (data, decimals) => {
  const givToken = data.pool.tokens.find((elem) => elem.symbol === 'GIV');
  const balance = parseUnits(givToken.balance, decimals);
  const totalShares = parseUnits(data.pool.totalShares, decimals);
  return { balance, totalShares };
};

const calcGivAmount = (
  amountLP: BigNumber,
  totalLP: BigNumber,
  givBalance: BigNumber
): BigNumber => {
  return amountLP.mul(givBalance).div(totalLP);
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  if (snapshot !== 'latest') {
    // @ts-ignore
    poolParams.pool.__args.block = { number: snapshot };
    // @ts-ignore
    params.balances.__args.block = { number: snapshot };
  }
  const balData = await subgraphRequest(BALANCER_SUBGRAPH_API, poolParams);
  const balFormatedData = formatReserveBalance(balData, options.decimals);

  params.balances.__args.where.id_in = addresses.map((address) =>
    address.toLowerCase()
  );

  const data = await subgraphRequest(GIVETH_SUBGRAPH_API, params);
  const dataBalances = data.balances;

  const score = {};
  dataBalances.map((addressBalance) => {
    const { id, balance, givStaked, balancerLp, balancerLpStaked } =
      addressBalance;
    const totalGIV = BigNumber.from(balance).add(givStaked);

    const balGIV = calcGivAmount(
      BigNumber.from(balancerLp).add(balancerLpStaked),
      balFormatedData.totalShares,
      balFormatedData.balance
    );
    score[getAddress(id)] = parseFloat(
      formatUnits(totalGIV.add(balGIV), options.decimals)
    );
  });

  return score;
}
