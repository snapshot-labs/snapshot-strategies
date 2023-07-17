import { strategy as UniswapV3Strategy } from '../uniswap-v3';
import { subgraphRequest } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';
import { getAddress } from '@ethersproject/address';

export const author = 'SID-Marcus';
export const version = '0.0.1';

const pancakeV3Subgraph =
  'https://api.thegraph.com/subgraphs/name/messari/pancakeswap-v3-bsc';

const UNISWAP_ID_USDC_PAIR = '0x6ac6b053a2858bea8ad758db680198c16e523184';
const PANCAKE_ID_USDT_PAIR = '0x4e1f9aDf96dBA6Dc09c973228c286568F1315ea8';

async function getLpTokenOnBsc(addresses, snapshot) {
  const params = {
    accounts: {
      __args: {
        where: {
          id_in: addresses
        },
        block: snapshot !== 'latest' ? { number: snapshot } : { number_gte: 0 }
      },
      id: true,
      withdraws: {
        __args: {
          where: { pool: PANCAKE_ID_USDT_PAIR }
        },
        inputTokenAmounts: true,
        timestamp: true
      },
      deposits: {
        __args: {
          where: { pool: PANCAKE_ID_USDT_PAIR }
        },
        inputTokenAmounts: true,
        timestamp: true
      }
    }
  };

  const pools = await subgraphRequest(pancakeV3Subgraph, params);

  const pancakeIDLPScore = {};
  for (const account of pools.accounts) {
    account.id = getAddress(account.id);
    let IdLPToken: BigNumber = BigNumber.from(0);
    for (const withdraw of account.withdraws) {
      IdLPToken = IdLPToken.add(BigNumber.from(withdraw.inputTokenAmounts[0]));
    }
    for (const deposit of account.deposits) {
      IdLPToken = IdLPToken.sub(BigNumber.from(deposit.inputTokenAmounts[0]));
    }
    pancakeIDLPScore[account.id] = IdLPToken.div(WeiPerEther).toNumber();
    pancakeIDLPScore[account.id] < 0 && (pancakeIDLPScore[account.id] = 0);
  }
  return pancakeIDLPScore;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  let LPScore = {};
  switch (network) {
    case '1':
      LPScore = await UniswapV3Strategy(
        space,
        network,
        provider,
        addresses,
        {
          poolAddress: UNISWAP_ID_USDC_PAIR,
          tokenReserve: 0
        },
        snapshot
      );
      break;
    case '56':
      LPScore = await getLpTokenOnBsc(addresses, snapshot);
      break;
  }
  return Object.fromEntries(
    addresses.map((address) => {
      const addressScore = LPScore[address] ?? 0;
      // console.log(address, LPScore[address], delegationPower[address]);
      return [getAddress(address), addressScore];
    })
  );
}
