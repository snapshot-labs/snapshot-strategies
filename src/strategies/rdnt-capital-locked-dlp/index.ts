import { Multicaller } from '../../utils';
import { getAddress } from '@ethersproject/address';
import { BigNumber } from '@ethersproject/bignumber';
import fetch from 'cross-fetch';

export const author = 'JDoy99';
export const version = '0.1.0';

const abi = [
  {
    name: 'lockedUsdValue',
    type: 'function',
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address'
      }
    ],
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view'
  }
];

const contractAddress = '0xd4966DC49a10aa5467D65f4fA4b1449b5d874399';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });

  addresses.forEach((address) => {
    multi.call(`${address}.lockedUsdValue`, contractAddress, 'lockedUsdValue', [
      address
    ]);
  });

  async function getTokenPrice() {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=radiant-capital`;
    const response = await fetch(url);
    const data = await response.json();
    return data[0].current_price;
  }

  const result = await multi.execute();
  const rdntPrice = await getTokenPrice();

  return Object.fromEntries(
    Object.entries(result).map(([address, value]: any) => {
      const usdValue: BigNumber = value.lockedUsdValue;
      const formattedUsdValue = usdValue.toNumber() / 100000000;
      const rdntPortion = formattedUsdValue * 0.8;
      const rdntPriceValue = parseFloat(rdntPrice);
      const rdntPortionFormatted = rdntPortion / rdntPriceValue;
      return [getAddress(address), rdntPortionFormatted];
    })
  );
}
