import { formatUnits } from '@ethersproject/units';
// import { BigNumber } from '@ethersproject/bignumber';
import { multicall } from '../../utils';

// const BIG18 = BigNumber.from('1000000000000000000');

export const author = 'FraxFinance';
export const version = '0.0.1';

// 0.0.1: Held FXS + veFXS from the VeFXSAggregator

const DECIMALS = 18;

const abi = ['function balanceOf(address account) view returns (uint256)'];

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
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // Fetch FXS Balance
  const fxsQuery = addresses.map((address: any) => [
    options.FXS,
    'balanceOf',
    [address]
  ]);

  // Fetch veFXS Balance
  const vefxsQuery = addresses.map((address: any) => [
    options.VEFXS_AGGREGATOR,
    'balanceOf',
    [address]
  ]);

  const response = await multicall(
    network,
    provider,
    abi,
    [...fxsQuery, ...vefxsQuery],
    { blockTag }
  );

  const chunks = chunk(response, addresses.length);
  const fxsBalances = chunks[0];
  const vefxsBalances = chunks[1];

  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        const free_fxs = fxsBalances[i][0];
        const vefxs = vefxsBalances[i][0];

        // Print statements
        // console.log(`==================${addresses[i]}==================`);
        // console.log("Free FXS: ", free_fxs.div(BIG18).toString());
        // console.log("veFXS: ", vefxs.div(BIG18).toString());
        // console.log(``);

        return [
          addresses[i],
          parseFloat(formatUnits(free_fxs.add(vefxs).toString(), DECIMALS))
        ];
      })
  );
}
