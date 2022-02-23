import fetch from 'cross-fetch';

export const author = 'kohrts';
export const version = '0.1.0';

export async function strategy(space, network, provider, addresses, options, snapshot) {
  const ETHTRADER_USERS_URL = 'https://raw.githubusercontent.com/EthTrader/donut.distribution/main/docs/users.json'
  
  const response = await fetch(ETHTRADER_USERS_URL, {
    method: 'GET',
      headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
      }
  });

  const data = await response.json();

  return Object.fromEntries(
    data.map((value) => [
      value.address,
      parseFloat(value.weight.toString())
    ])
  );
}