import { getSwaprLiquidityProvidersBalance } from './swapr-lps';
import { strategy as erc20BalanceOfStartegy } from '../erc20-balance-of';
import { mergeBalanceMaps } from './commons';
import { getAddress } from '@ethersproject/address';

export const author = 'luzzif';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const lpData = await getSwaprLiquidityProvidersBalance(
    network,
    addresses,
    options,
    snapshot
  );

  let i = 0;
  const PAGE_SIZE = 250;
  let rawErc20HoldersData: { [address: string]: number } = {};
  while (true) {
    const pageData = await erc20BalanceOfStartegy(
      space,
      network,
      provider,
      addresses.slice(PAGE_SIZE * i, PAGE_SIZE * i + PAGE_SIZE),
      options,
      snapshot
    );
    rawErc20HoldersData = { ...rawErc20HoldersData, ...pageData };
    if (Object.keys(pageData).length < PAGE_SIZE) break;
    i++;
  }

  // make sure the addresses have the correct casing before
  // merging the balance maps
  const erc20HoldersData = Object.entries(rawErc20HoldersData).reduce(
    (accumulator, [address, balance]) => {
      accumulator[getAddress(address)] = balance;
      return accumulator;
    },
    {}
  );

  const score: { [address: string]: number } = {};
  mergeBalanceMaps(score, lpData);
  mergeBalanceMaps(score, erc20HoldersData);
  return score;
}
