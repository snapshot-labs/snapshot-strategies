import { subgraphRequest } from '../../utils';
import fetch from 'cross-fetch';
import { Multicaller, call, getProvider } from '../../utils';
import { formatUnits } from '@ethersproject/units';

export const author = 'drgorillamd';
export const version = '1.0.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {

  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const block = await provider.getBlock(blockTag);
  const timestamp = block.timestamp;
  const avaxBlockTag = await getAvaxBlockTag(timestamp, options);

  // BSC balances:
  const multiBsc = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address: string) => {
    multiBsc.call(address+"-jade", options.JADE.address, 'balanceOf', [address]);
    multiBsc.call(address+"-sjade", options.SJADE.address, 'balanceOf', [address]);
  });

  // Avax balances:
  const multiAvax = new Multicaller('43114', getProvider('43114'), abi, { blockTag: avaxBlockTag });
  addresses.forEach((address: string) => {
    multiAvax.call(address+"-smrt", options.SMRT.address, 'balanceOf', [address]);
    multiAvax.call(address+"-smrtR", options.SMRTR.address, 'balanceOf', [address]);
    multiAvax.call(address+"-smrtRLp", options.SMRTRLP.address, 'balanceOf', [address])
  });

  // Avax SMRTR/WAVAX pool: SMRTR balance and LP token total supply
  const LPBalance = await call(getProvider('43114'), abi, [options.SMRTR.address, 'balanceOf', [options.SMRTRLP.address]]);
  const LPSupply =  await call(getProvider('43114'), abi, [options.SMRTRLP.address, 'totalSupply', []]);

  let jadePrice: number = 0, 
    smrtPrice: number = 0, 
    smrtRPrice: number = 0, 
    resBsc: Record<string, number> = {0:0},
    resAvax: [number, number, number, Record<string, number>, Record<string, number>] = [0,0,0,{0:0}, {0:0}];

   [jadePrice, 
    smrtPrice, 
    smrtRPrice, 
    resBsc,
    resAvax] = await Promise.all([
      geckoPrice(options.JADE.address, timestamp, 'binance-smart-chain'),
      geckoPrice(options.SMRT.address, timestamp, 'avalanche'),
      geckoPrice(options.SMRTR.address, timestamp, 'avalanche'),
      multiBsc.execute(),
      multiAvax.execute()
    ]);

  return Object.fromEntries(
    addresses.map( (adr: string) => {
      let bal = parseFloat(formatUnits(resBsc[adr+"-jade"], options.JADE.decimals));
      bal += parseFloat(formatUnits(resBsc[adr+"-sjade"], options.SJADE.decimals));

      // SMRT balance * SMRT price/JADE price:
      const parsedSmrt = parseFloat(formatUnits(
        resAvax[adr+"-smrt"],
        options.SMRT.decimals));
      bal += parsedSmrt * smrtPrice / jadePrice;

      // SMRTR balance * SMRTR price/JADE price:
      const parsedSrmtr = parseFloat(formatUnits(
        resAvax[adr+"-smrtR"],
        options.SMRTR.decimals));
      bal += parsedSrmtr * smrtRPrice / jadePrice;

      // LP token held * smrtr pool balance / LP token total supply:
      const LPHeld = resAvax[adr+"-smrtRLp"].mul(LPBalance).div(LPSupply);
      const parsedLP = parseFloat(formatUnits(
        LPHeld,
        options.SMRTR.decimals));
      bal += parsedLP * smrtRPrice / jadePrice;

      return [adr, bal];
    })
  );             
}

async function getAvaxBlockTag(
  timestamp: number,
  options
): Promise<number> {
  const query = {
    blocks: {
      __args: {
        first: 1,
        orderBy: 'number',
        orderDirection: 'desc',
        where: {
          timestamp_lte: timestamp
        }
      },
      number: true,
      timestamp: true
    }
  };
  const data = await subgraphRequest(options.avaxGraph, query);
  return Number(data.blocks[0].number);
}

async function geckoPrice(address, timestamp, chain): Promise<number> {
  const coingeckoApiURL = `https://api.coingecko.com/api/v3/coins/${chain}/contract/${address}/market_chart/range?vs_currency=usd&from=${
    timestamp - 100000
  }&to=${timestamp}`;
  const coingeckoData = await fetch(coingeckoApiURL)
    .then(async (r) => {
      const json = await r.json();
      return json;
    })
    .catch((e) => {
      console.error(e);
      throw new Error('jade-smrt:coingecko api failed');
    });

    return coingeckoData.prices?.pop()?.pop() || 0;
}