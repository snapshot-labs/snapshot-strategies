import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'clement-ux';
export const version = '0.0.1';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)'
];

const veSDT = '0x0C30476f66034E11782938DF8e4384970B6c9e8a';
const DECIMALS = 18;

const F1 = 0.4;
const F2 = 0.6;

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const w_uQuery = addresses.map((address: any) => [
    veSDT,
    'balanceOf',
    [address]
  ]);
  const b_uuQuery = addresses.map((address: any) => [
    options.gauge,
    'balanceOf',
    [address]
  ]);
  const b_usQuery = addresses.map((address: any) => [
    options.sdToken,
    'balanceOf',
    [address]
  ]);

  const response = await multicall(
    network,
    provider,
    abi,
    [
      [options.veToken, 'balanceOf', [options.lockerToken]],
      [veSDT, 'totalSupply'],
      [options.gauge, 'totalSupply'],
      ...w_uQuery,
      ...b_uuQuery,
      ...b_usQuery
    ],
    {
      blockTag
    }
  );

  // Constant
  // Get V : total Liquid Locker voting power
  const V = response[0];
  // Get W : total veSDT supply
  const W = response[1];
  // Get Bs : total balance of staked sdToken
  const Bs = response[2];

  const responseClean = response.slice(3, response.length);
  const chunks = chunk(responseClean, addresses.length);

  // Variable per address
  // Get w_u : user veSDT balance
  const w_u = chunks[0];
  // Get b_uu : user balance of unstaked sdToken
  const b_uu = chunks[1];
  // Get b_us : user balance of staked sdToken
  const b_us = chunks[2];

  // Get beta_u = user adjusted balance of staked sdToken
  const beta_u = Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        const w_ui = w_u[i][0];
        const b_ui = b_uu[i][0].add(b_us[i][0]);
        const wRatio = w_ui / W[0];
        const a_ui = b_ui * F1 + Bs * wRatio * F2;
        const beta_ui = Math.min(a_ui, b_ui);

        // Print statements variable per address
        console.log(`==================${addresses[i]}==================`);
        console.log('Balance veSDT: ', (w_ui / 10 ** DECIMALS).toString());
        console.log('Balance of sdToken: ', (b_ui / 10 ** DECIMALS).toString());
        console.log(
          'Ratio balance/supply veSDT: ',
          (wRatio * 100).toString(),
          '%'
        );
        console.log(
          'Calcul inside adjusted balance: ',
          (a_ui / 10 ** DECIMALS).toString()
        );
        console.log('Beta_u: ', (beta_ui / 10 ** DECIMALS).toString());
        console.log(``);

        return [
          addresses[i],
          parseFloat(formatUnits(beta_ui.toString(), DECIMALS))
        ];
      })
  );

  // Get Eb_u : sum of all user adjusted balance of staked sdToken
  let Eb_u = 0;
  addresses.forEach((address) => {
    Eb_u += beta_u[address];
  });

  // Print statements variable per address
  console.log('Total veSDT suppy: ', W / 10 ** DECIMALS);
  console.log('Sum of all user adjusted balance of sdToken: ', Eb_u);
  console.log('Total Liquid Locker voting power: ', V / 10 ** DECIMALS);

  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        // Get v_u : user voting power
        const v_u = Eb_u > 0 ? (beta_u[addresses[i]] * V) / Eb_u : 0;
        return [addresses[i], v_u / 10 ** DECIMALS];
      })
  );
}
