import { subgraphRequest } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';
import { parseUnits, formatUnits } from '@ethersproject/units';

export const author = 'pkretzschmar';
export const version = '0.1.0';

const GIVETH_SUBGRAPH_API =
  'https://api.thegraph.com/subgraphs/name/giveth/giveth-economy-xdai';
const XDAI_BLOCKS_API =
  'https://api.thegraph.com/subgraphs/name/1hive/xdai-blocks';
const PAIR_IDS = [
  '0x08ea9f608656a4a775ef73f5b187a2f1ae2ae10e',
  '0x55ff0cef43f0df88226e9d87d09fa036017f5586'
];
const PAIR_APIS = [
  'https://api.thegraph.com/subgraphs/name/1hive/honeyswap-xdai',
  'https://api.thegraph.com/subgraphs/name/sushiswap/xdai-exchange'
];

const blockParams = {
  blocks: {
    __args: {
      first: 1,
      orderBy: 'timestamp',
      orderDirection: 'desc',
      where: {
        timestamp_lte: ''
      }
    },
    number: true
  }
};

const pairParams = {
  pair: {
    __args: {
      id: ''
    },
    reserve0: true,
    totalSupply: true
  }
};

const params = {
  balance: {
    __args: {
      id: ''
    },
    balance: true,
    givStaked: true,
    honeyswapLp: true,
    honeyswapLpStaked: true,
    sushiswapLp: true,
    sushiSwapLpStaked: true
  }
};

const formatReserveBalance = (data, decimals) => {
  const reserve = parseUnits(data.pair.reserve0, decimals);
  const totalSupply = parseUnits(data.pair.totalSupply, decimals);
  return { reserve, totalSupply };
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
    const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
    const block = await provider.getBlock(blockTag);
    blockParams.blocks.__args.where.timestamp_lte = block.timestamp;
    const xDaiBlock = await subgraphRequest(XDAI_BLOCKS_API, blockParams);
    const blockNumber = Number(xDaiBlock.blocks[0].number);
    // @ts-ignore
    pairParams.pair.__args.block = { number: blockNumber };
    // @ts-ignore
    params.balance.__args.block = { number: blockNumber };
  }
  const [hnyData, sushiData] = await Promise.all(
    PAIR_APIS.map((API, index) => {
      pairParams.pair.__args.id = PAIR_IDS[index];
      return subgraphRequest(API, pairParams);
    })
  );
  const hnyFormatedData = formatReserveBalance(hnyData, options.decimals);
  const sushiFormatedData = formatReserveBalance(sushiData, options.decimals);
  const data = await Promise.all(
    addresses.map((address) => {
      params.balance.__args.id = address.toLowerCase();
      return subgraphRequest(GIVETH_SUBGRAPH_API, params);
    })
  );

  const result = {};
  addresses.map((address, index) => {
    const {
      balance,
      givStaked,
      honeyswapLp,
      honeyswapLpStaked,
      sushiswapLp,
      sushiSwapLpStaked
    } = data[index].balance;
    const totalGIV = BigNumber.from(balance).add(givStaked);
    const hnyGIV = calcGivAmount(
      BigNumber.from(honeyswapLp).add(honeyswapLpStaked),
      hnyFormatedData.totalSupply,
      hnyFormatedData.reserve
    );
    const sushiGIV = calcGivAmount(
      BigNumber.from(sushiswapLp).add(sushiSwapLpStaked),
      sushiFormatedData.totalSupply,
      sushiFormatedData.reserve
    );
    result[address] = parseFloat(
      formatUnits(totalGIV.add(hnyGIV).add(sushiGIV), options.decimals)
    );
  });
  return result;
}
