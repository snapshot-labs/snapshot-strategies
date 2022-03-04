import { subgraphRequest } from '../../utils';
import { Multicaller, getProvider } from '../../utils';
import { formatUnits } from '@ethersproject/units';

export const author = 'drgorillamd';
export const version = '1.0.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)'
];

const BUSD = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';
const WAVAX = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7';
const USDC = '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664';
const WAVAXUSDC = '0xA389f9430876455C36478DeEa9769B7Ca4E3DDB1';

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
    multiBsc.call(address + '-jade', options.JADE.address, 'balanceOf', [
      address
    ]);
    multiBsc.call(address + '-sjade', options.SJADE.address, 'balanceOf', [
      address
    ]);
  });

  // BUSD per JADE spot - pick CAREFULLY the block height, it is NOT a twap
  // as a twap would require 2 additionnal multicalls (and therefore be above the Snapshot 5 calls limit)
  multiBsc.call('jadeLPBalance', options.JADE.address, 'balanceOf', [
    options.JADELP.address
  ]); // jade balance in jade-busd pool
  multiBsc.call('busdLPBalance', BUSD, 'balanceOf', [options.JADELP.address]); // BUSD balance in jade-busd pool

  // Avax balances:
  const multiAvax = new Multicaller('43114', getProvider('43114'), abi, {
    blockTag: avaxBlockTag
  });
  addresses.forEach((address: string) => {
    multiAvax.call(address + '-smrt', options.SMRT.address, 'balanceOf', [
      address
    ]);
    multiAvax.call(address + '-smrtR', options.SMRTR.address, 'balanceOf', [
      address
    ]);
    multiAvax.call(address + '-smrtRLp', options.SMRTRLP.address, 'balanceOf', [
      address
    ]);
  });

  // WAVAX per SMRT spot
  multiAvax.call('smrtLPBalance', options.SMRT.address, 'balanceOf', [
    options.SMRTLP.address
  ]); // SMRT in SMRT/WAVAX pool balance
  multiAvax.call('wavaxSmrtLPBalance', WAVAX, 'balanceOf', [
    options.SMRTLP.address
  ]); // wavax in SMRT/WAVAX pool balance

  // WAVAX per SMRTR spot
  multiAvax.call('smrtRLPBalance', options.SMRTR.address, 'balanceOf', [
    options.SMRTRLP.address
  ]);
  multiAvax.call('wavaxSmrtRLPBalance', WAVAX, 'balanceOf', [
    options.SMRTRLP.address
  ]); // SMRT SMRT/WAVAX pool balance

  // USD per WAVAX spot
  multiAvax.call('UsdLPBalance', USDC, 'balanceOf', [WAVAXUSDC]); // SMRT SMRT/WAVAX pool balance
  multiAvax.call('wavaxUsdLPBalance', WAVAX, 'balanceOf', [WAVAXUSDC]); // SMRT SMRT/WAVAX pool balance

  // Avax SMRTR/WAVAX pool: LP token total supply
  multiAvax.call('smrtRLPSupply', options.SMRTRLP.address, 'totalSupply', []);

  let resBsc: Record<string, number> | number = { 0: 0 },
    resAvax:
      | [number, number, number, Record<string, number>, Record<string, number>]
      | number = [0, 0, 0, { 0: 0 }, { 0: 0 }];

  [resBsc, resAvax] = await Promise.all([
    multiBsc.execute(),
    multiAvax.execute()
  ]);

  // All prices in USDish (BUSD or USDC.e)
  const jadePrice: number =
    parseFloat(formatUnits(resBsc['busdLPBalance'], 18)) /
    parseFloat(formatUnits(resBsc['jadeLPBalance'], 9));
  const wavaxPrice: number =
    parseFloat(formatUnits(resAvax['UsdLPBalance'], 6)) /
    parseFloat(formatUnits(resAvax['wavaxUsdLPBalance'], 18));
  const smrtPrice: number =
    wavaxPrice /
    (parseFloat(formatUnits(resAvax['smrtLPBalance'], 18)) /
      parseFloat(formatUnits(resAvax['wavaxSmrtLPBalance'], 18)));
  const smrtRPrice: number =
    wavaxPrice /
    (parseFloat(formatUnits(resAvax['smrtRLPBalance'], 18)) /
      parseFloat(formatUnits(resAvax['wavaxSmrtRLPBalance'], 18)));
  const smrtRLPBalance: number = parseFloat(
    formatUnits(resAvax['smrtRLPBalance'], 18)
  );
  const smrtRLPSupply: number = parseFloat(
    formatUnits(resAvax['smrtRLPSupply'], 18)
  );

  return Object.fromEntries(
    addresses.map((adr: string) => {
      let bal = parseFloat(
        formatUnits(resBsc[adr + '-jade'], options.JADE.decimals)
      );
      bal += parseFloat(
        formatUnits(resBsc[adr + '-sjade'], options.SJADE.decimals)
      );

      // SMRT balance * SMRT price/JADE price:
      const parsedSmrt = parseFloat(
        formatUnits(resAvax[adr + '-smrt'], options.SMRT.decimals)
      );
      bal += (parsedSmrt * smrtPrice) / jadePrice;

      // SMRTR balance * SMRTR price/JADE price:
      const parsedSrmtr = parseFloat(
        formatUnits(resAvax[adr + '-smrtR'], options.SMRTR.decimals)
      );
      bal += (parsedSrmtr * smrtRPrice) / jadePrice;

      // LP token held * smrtr pool balance / LP token total supply:
      const LPHeld =
        (parseFloat(formatUnits(resAvax[adr + '-smrtRLp'], 18)) *
          smrtRLPBalance) /
        smrtRLPSupply;
      bal += (LPHeld * smrtRPrice) / jadePrice;

      return [adr, bal];
    })
  );
}

async function getAvaxBlockTag(timestamp: number, options): Promise<number> {
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
