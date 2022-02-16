import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'printerfinancial';
export const version = '0.1.0';

const PRINTER_ADDRESS = '0xb1E6B2a4e6c5717CDBf8F6b01e89455C920a3646';
const INK_TOKEN_ADDRESS = '0xFFAbb85ADb5c25D57343547a8b32B62f03814B12';
const INK_LP_TOKEN_ADDRESS = '0xDECC75dBF9679d7A3B6AD011A98F05b5CC6A8a9d';
const POOLS_ADDRESS = '0xF95AB2A261B0920f3d5aBc02A41dBe125eBA10aE';

const abi = [
  'function balanceOf(address) view returns (uint256 amount)',
  'function userInfo(uint256, address) view returns (uint256 amount, uint256 rewardDebt)',
  'function totalSupply() view returns (uint256)',
  'function strategy() view returns (address)'
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

  let multi = new Multicaller(network, provider, abi, { blockTag });

  multi = new Multicaller(network, provider, abi, { blockTag });

  multi.call(`lp.inkBalance`, INK_TOKEN_ADDRESS, 'balanceOf', [
    INK_LP_TOKEN_ADDRESS
  ]);
  multi.call(`lp.totalSupply`, INK_LP_TOKEN_ADDRESS, 'totalSupply');

  addresses.forEach((address: any) => {
    multi.call(`ink.${address}`, INK_TOKEN_ADDRESS, 'balanceOf', [
      address
    ]);
    multi.call(`inkInPrinter.${address}`, PRINTER_ADDRESS, 'balanceOf', [
      address
    ]);
    multi.call(`lpInPools.${address}`, POOLS_ADDRESS, 'userInfo', [
      '1',
      address
    ]);
    multi.call(`lp.${address}`, INK_LP_TOKEN_ADDRESS, 'balanceOf', [
      address
    ]);
  });

  const result = await multi.execute();

  return Object.fromEntries(
    addresses.map((address: any) => {
      const inkInWallet = parseFloat(
        formatUnits(result.ink[address], 18)
      );

      const inkInLpInWallet = parseFloat(
        formatUnits(
          result.lp[address]
            .mul(result.lp.inkBalance)
            .div(result.lp.totalSupply),
          18
        )
      );

      const inkInPrinter = parseFloat(
        formatUnits(result.inkInPrinter[address], 18)
      );

      const inkInPools = parseFloat(
        formatUnits(
          result.lpInPools[address].amount
            .mul(result.lp.inkBalance)
            .div(result.lp.totalSupply),
          18
        )
      );

      return [
        address,
        Math.sqrt(
          inkInWallet +
            inkInLpInWallet +
            inkInPrinter +
            inkInPools
        )
      ];
    })
  );
}
