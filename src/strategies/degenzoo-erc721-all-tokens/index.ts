import fetch from 'cross-fetch';
import { getAddress } from '@ethersproject/address';

export const author = 'aorfevre';
export const version = '0.1.0';


export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {

  // initialize scores
  const scores = {};
  for (const address of addresses) {
    scores[getAddress(address)] = 0;
  }


  async function getWalletScore(wallet) {
    const url = `https://api.daomaker.com/get-dzoo-assets-by-wallet?wallet=${wallet}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();
    return data.total;
  };
  
  const promises: any = [];
  addresses.forEach(function (address) {
    return promises.push(
      getWalletScore(address).then((r) => {
        scores[address] = r;
      })
    );
  });
  await Promise.all(promises);

  return scores;
}
