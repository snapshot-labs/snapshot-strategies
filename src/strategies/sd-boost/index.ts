import { multicall } from '../../utils';

export const author = 'clement-ux';
export const version = '0.0.3';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function working_supply() external view returns (uint256)'
];

const veSDT = '0x0C30476f66034E11782938DF8e4384970B6c9e8a';

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

  const veSDTBalanceQuery = addresses.map((address: any) => [
    veSDT,
    'balanceOf',
    [address]
  ]);
  const sdTokenBalanceQuery = addresses.map((address: any) => [
    options.gauge,
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
      [options.gauge, 'working_supply'],
      ...veSDTBalanceQuery,
      ...sdTokenBalanceQuery
    ],
    {
      blockTag
    }
  );

  // Constant
  // Get LLVotingPower : total Liquid Locker voting power
  const LLVotingPower = response[0];
  // Get veSDTSupply : total veSDT supply
  const veSDTSupply = response[1];
  // Get gaugeSupply : total balance of staked sdToken
  const gaugeSupply = response[2];
  // Get Working supply on the gauge
  const workingSupply = response[3];

  const responseClean = response.slice(4, response.length);
  const chunks = chunk(responseClean, addresses.length);

  // Variable per address
  // Get veSDTBalance : user veSDT balance
  const veSDTBalance = chunks[0];
  // Get sdTokenBalance : user balance of staked sdToken
  const sdTokenBalance = chunks[1];

  // Get adjustedBalance = user adjusted balance of staked sdToken
  const adjustedBalance = Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        const veSDTRatio = veSDTBalance[i][0] / veSDTSupply[0];
        const derived_i =
          sdTokenBalance[i][0] * F1 + gaugeSupply * veSDTRatio * F2;
        const adjustedBalance_i = Math.min(derived_i, sdTokenBalance[i][0]);

        // Print statements variable per address
        //console.log(`==================${addresses[i]}==================`);
        //console.log(
        //  'Balance veSDT: ',
        //  (veSDTBalance[i][0] / 10 ** DECIMALS).toString()
        //);
        //console.log(
        //  'Balance of sdToken: ',
        //  (sdTokenBalance[i][0] / 10 ** DECIMALS).toString()
        //);
        //console.log(
        //  'Ratio balance/supply veSDT: ',
        //  (veSDTRatio * 100).toString(),
        //  '%'
        //);
        //console.log(
        //  'Calcul inside adjusted balance: ',
        //  (derived_i / 10 ** DECIMALS).toString()
        //);
        //console.log(
        //  'AdjustedBalance: ',
        //  (adjustedBalance_i / 10 ** DECIMALS).toString()
        //);
        //console.log(
        //  'LLVotingPower: ',
        //  (LLVotingPower / 10 ** DECIMALS).toString()
        //);
        //console.log('veSDTSupply: ', (veSDTSupply / 10 ** DECIMALS).toString());
        //console.log('gaugeSupply: ', (gaugeSupply / 10 ** DECIMALS).toString());
        //console.log(
        //  'Working Supply: ',
        //  (workingSupply / 10 ** DECIMALS).toString()
        //);
        // console.log(``);```
        return [addresses[i], adjustedBalance_i / 10 ** options.decimals];
      })
  );

  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        // Get votingPower : user voting power
        const votingPower =
          workingSupply > 0
            ? (adjustedBalance[addresses[i]] * LLVotingPower) / workingSupply
            : 0;
        return [addresses[i], votingPower];
      })
  );
}
